import joblib
import numpy as np
import json
import logging
import re
from pathlib import Path
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)


class MLService:
    """Main ML service for all model inference"""

    def __init__(self):
        logger.info("Initializing ML Service...")
        self.models_loaded = False
        self.chatbot_sessions = {}

        try:
            self._load_risk_models()
            self._load_sentiment_models()
            self._load_recommendation_models()
            self._load_chatbot_config()
            self.models_loaded = True
            logger.info("All ML models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}", exc_info=True)
            raise

    # -------------------------------------------------------------------------
    # MODEL LOADING
    # -------------------------------------------------------------------------

    def _load_risk_models(self):
        base_path = Path('models/risk_escalation')
        self.rf_model    = joblib.load(base_path / 'risk_rf.pkl')
        self.xgb_model = joblib.load(base_path / 'risk_xgb_clean.pkl')
        self.lgbm_model  = joblib.load(base_path / 'risk_lgbm.pkl')
        self.risk_scaler = joblib.load(base_path / 'risk_scaler.pkl')
        # Use new Colab config if available, fall back to old
        config_path = base_path / 'risk_config.json'
        if not config_path.exists():
             config_path = base_path / 'config.json'
        with open(config_path) as f:
            self.risk_config = json.load(f)

        w = self.risk_config.get("weights", {})
        self.risk_weights = {
            "rf":   w.get("rf",   w.get("random_forest",  0.25)),
            "xgb":  w.get("xgb",  w.get("xgboost",        0.25)),
            "lgbm": w.get("lgbm", w.get("lightgbm",        0.25)),
            "nn":   w.get("nn",   w.get("neural_network",  0.25)),
        }

        # Normalise so weights always sum to 1
        total = sum(self.risk_weights.values()) or 1
        self.risk_weights = {k: v / total for k, v in self.risk_weights.items()}

        try:
           import tensorflow as tf
           self.nn_model = tf.keras.models.load_model(base_path / 'risk_nn.h5')
           logger.info("Risk NN loaded")
        except Exception as e:
            logger.warning(f"Risk NN not loaded: {e}")
            self.nn_model = None

    def _load_sentiment_models(self):
        logger.info("Loading sentiment models...")
        base_path = Path('models/sentiment')
        self.tfidf_vectorizer        = joblib.load(base_path / 'sentiment_tfidf.pkl')
        self.lr_model                = joblib.load(base_path / 'sentiment_lr.pkl')
        self.sentiment_label_encoder = joblib.load(base_path / 'sentiment_encoder.pkl')
        self.sentiment_tokenizer     = joblib.load(base_path / 'sentiment_tokenizer.pkl')
        with open(base_path / 'sentiment_config.json') as f:
            self.sentiment_config = json.load(f)
           
        # Build flat crisis keyword list from tiered dict or plain list
        raw_kw = self.sentiment_config.get("crisis_keywords", [])
        if isinstance(raw_kw, dict):
            flat = []
            for v in raw_kw.values():
                flat.extend(v)
            self._crisis_keywords = flat
        else:
            self._crisis_keywords = list(raw_kw)

        # Load deep-learning sentiment models (optional)
        # Load deep-learning sentiment models (optional)
        try:
            import tensorflow as tf
            cnn_lstm  = base_path / "sentiment_cnn_lstm_model.h5"
            cnn_keras = base_path / "sentiment_cnn.keras"
            if cnn_lstm.exists():
                self.cnn_model = tf.keras.models.load_model(cnn_lstm)
            elif cnn_keras.exists():
                self.cnn_model = tf.keras.models.load_model(cnn_keras)
            else:
                self.cnn_model = None

            bilstm_h5    = base_path / "sentiment_bilstm_model.h5"
            bilstm_keras = base_path / "sentiment_bilstm.keras"
            if bilstm_h5.exists():
                self.bilstm_model = tf.keras.models.load_model(bilstm_h5)
            elif bilstm_keras.exists():
                self.bilstm_model = tf.keras.models.load_model(bilstm_keras)
            else:
                self.bilstm_model = None

            logger.info(f"Sentiment DL models — CNN: {self.cnn_model is not None}, BiLSTM: {self.bilstm_model is not None}")
        except Exception as e:
            logger.warning(f"Sentiment DL models not loaded: {e}")
            self.cnn_model = None
            self.bilstm_model = None

        # Build sentiment ensemble weights
        perf = self.sentiment_config.get("weights", {})
        self.sent_weights = {
            "lr":     perf.get("logistic_regression", 0.333),
            "cnn":    perf.get("cnn",    0.333),
            "bilstm": perf.get("bilstm", 0.334),
        }
        logger.info("Sentiment models loaded")

    def _load_recommendation_models(self):
        logger.info("Loading recommendation models...")
        base = Path("models/recommendation")

        self.user_similarity      = joblib.load(base / "user_similarity.pkl")
        self.resource_similarity  = joblib.load(base / "resource_similarity.pkl")
        self.user_resource_matrix = joblib.load(base / "user_resource_matrix.pkl")
        self.resources_df         = joblib.load(base / "resources_df.pkl")

        logger.info("Recommendation models loaded")

    def _load_chatbot_config(self):
        logger.info("Loading chatbot config...")

        # Try both possible config paths
        paths = [
            Path("models/chatbot/chatbot_config.json"),
            Path("models/chatbot/config.json"),
        ]
        cfg = None
        for p in paths:
            if p.exists():
                with open(p) as f:
                    cfg = json.load(f)
                break

        if cfg is None:
            logger.warning("chatbot_config.json not found — using default config")
            cfg = self._default_chatbot_config()

        # Ensure required keys exist
        cfg.setdefault("questions", self._default_chatbot_config()["questions"])
        cfg.setdefault("empathetic_responses", self._default_chatbot_config()["empathetic_responses"])
        cfg.setdefault("risk_thresholds", {"CRITICAL": 15, "HIGH": 10, "MODERATE": 5})
        cfg.setdefault("max_score", 20)

        self.chatbot_config = cfg
        logger.info("Chatbot config loaded")

    def _default_chatbot_config(self):
        return {
            "questions": [
                {"id": "q1", "text": "Have you experienced physical violence in the past month?",
                 "type": "yes_no", "weight": 3},
                {"id": "q2", "text": "Has your partner threatened to kill you or your children?",
                 "type": "yes_no", "weight": 5},
                {"id": "q3", "text": "Has your partner ever choked or strangled you?",
                 "type": "yes_no", "weight": 5},
                {"id": "q4", "text": "Does your partner have access to a weapon?",
                 "type": "yes_no", "weight": 4},
                {"id": "q5", "text": "Are you afraid of what your partner might do?",
                 "type": "yes_no", "weight": 3},
            ],
            "empathetic_responses": {
                "q1": "Thank you for trusting me with that. You are not alone.",
                "q2": "That must have been terrifying. Your safety is what matters most.",
                "q3": "That is very serious. Strangulation is a critical safety warning sign.",
                "q4": "Thank you for telling me. This information helps me understand your situation.",
                "q5": "Your feelings are valid. Let me help you find support.",
            },
            "risk_thresholds": {"CRITICAL": 15, "HIGH": 10, "MODERATE": 5},
            "max_score": 20,
        }

    # -------------------------------------------------------------------------
    # TEXT PREPROCESSING (mirrors training pipeline)
    # -------------------------------------------------------------------------

    def _preprocess_text(self, text):
        """Clean text the same way training data was prepared."""
        text = str(text).lower()
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        return text.strip()

    # -------------------------------------------------------------------------
    # RISK ESCALATION
    # -------------------------------------------------------------------------

    def predict_escalation(self, assessment_data):
        try:
            features = self._prepare_risk_features(assessment_data)
            features_scaled = self.risk_scaler.transform([features])

            rf_prob = float(self.rf_model.predict_proba([features])[0][1])

            try:
                import xgboost as xgb
                feature_names = self.risk_config.get("features", [])
                import pandas as pd
                df_features = pd.DataFrame([features], columns=feature_names)
                xgb_prob = float(self.xgb_model._Booster.predict(xgb.DMatrix(df_features))[0])
            except Exception as e:
                logger.warning(f"XGBoost fallback to RF: {e}")
                xgb_prob = rf_prob

            try:
                lgbm_prob = float(self.lgbm_model.predict_proba([features])[0][1])
            except Exception:
                lgbm_prob = (rf_prob + xgb_prob) / 2

            if self.nn_model:
                try:
                    nn_prob = float(self.nn_model.predict(features_scaled, verbose=0)[0][0])
                except Exception:
                    nn_prob = (rf_prob + xgb_prob + lgbm_prob) / 3
            else:
                nn_prob = (rf_prob + xgb_prob + lgbm_prob) / 3

            w = self.risk_weights
            ensemble_prob = (
                rf_prob   * w["rf"] +
                xgb_prob  * w["xgb"] +
                lgbm_prob * w["lgbm"] +
                nn_prob   * w["nn"]
            )

            if ensemble_prob >= 0.75:
                risk_level = "CRITICAL"
            elif ensemble_prob >= 0.50:
                risk_level = "HIGH"
            elif ensemble_prob >= 0.30:
                risk_level = "MODERATE"
            else:
                risk_level = "LOW"

            key_factors     = self._get_key_risk_factors(assessment_data)
            recommendations = self._get_safety_recommendations(risk_level, assessment_data)

            return {
                "success": True,
                "escalation_probability": round(ensemble_prob, 4),
                "risk_level": risk_level,
                "confidence": round(max(rf_prob, xgb_prob, lgbm_prob, nn_prob), 4),
                "key_risk_factors": key_factors,
                "recommendations": recommendations,
                "model_performance": {
                    "ensemble_auc": self.risk_config.get("performance", {}).get("ensemble_auc", 0),
                    "individual_models": {
                        "random_forest":  round(rf_prob,   4),
                        "xgboost":        round(xgb_prob,  4),
                        "lightgbm":       round(lgbm_prob, 4),
                        "neural_network": round(nn_prob,   4),
                    },
                },
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _prepare_risk_features(self, data):
        feature_order = self.risk_config.get("features", [])
        return [float(data.get(f, 0)) for f in feature_order]

    def _get_key_risk_factors(self, assessment_data):
        # Try feature_importance list first (old format),
        # then fall back to computing from model
        fi = self.risk_config.get("feature_importance", [])
        if fi:
            importance_map = {item["feature"]: item.get("avg_importance", item.get("avg", 0))
                              for item in fi}
        else:
            # Build from RF importances
            features = self.risk_config.get("features", [])
            importances = self.rf_model.feature_importances_ if hasattr(self.rf_model, "feature_importances_") else []
            importance_map = dict(zip(features, importances)) if len(importances) == len(features) else {}

        factors = [
            {"factor": feat, "importance": importance_map.get(feat, 0)}
            for feat, value in assessment_data.items()
            if value and feat in importance_map
        ]
        factors.sort(key=lambda x: x["importance"], reverse=True)
        return [f["factor"] for f in factors[:5]]

    def _get_safety_recommendations(self, risk_level, data):
        recs_map = {
            "CRITICAL": {
                "immediate_actions": [
                    "Consider activating Emergency SOS now",
                    "Contact emergency shelter immediately",
                    "Do NOT return home if unsafe",
                    "Call police if in immediate danger (999)",
                ],
                "resources_needed": ["Shelter", "Police", "Medical"],
            },
            "HIGH": {
                "immediate_actions": [
                    "Create detailed safety plan within 24 hours",
                    "Contact legal aid for protection order",
                    "Identify safe locations you can go quickly",
                    "Pack emergency bag with essentials",
                ],
                "resources_needed": ["Shelter", "Legal", "Counseling"],
            },
            "MODERATE": {
                "immediate_actions": [
                    "Document incidents in Evidence Vault",
                    "Connect with counseling services",
                    "Build support network",
                    "Learn about your legal options",
                ],
                "resources_needed": ["Counseling", "Legal", "Support Groups"],
            },
            "LOW": {
                "immediate_actions": [
                    "Stay aware of warning signs",
                    "Keep HALO app accessible",
                    "Maintain connections with friends/family",
                    "Know your rights",
                ],
                "resources_needed": ["Counseling", "Education"],
            },
        }
        recs = recs_map.get(risk_level, recs_map["MODERATE"])
        if data.get("children_harmed") or data.get("has_children"):
            recs["immediate_actions"].insert(1, "Ensure children are safe — contact child protection if needed")
            if "Child Protection" not in recs["resources_needed"]:
                recs["resources_needed"].append("Child Protection")
        return recs

    # -------------------------------------------------------------------------
    # SENTIMENT ANALYSIS
    # -------------------------------------------------------------------------

    def analyze_sentiment(self, text):
        try:
            clean = self._preprocess_text(text)
            text_lower = text.lower()

            # LR prediction
            tfidf_vec   = self.tfidf_vectorizer.transform([clean])
            lr_proba    = self.lr_model.predict_proba(tfidf_vec)[0]
            classes     = self.sentiment_label_encoder.classes_

            ensemble_proba = lr_proba * self.sent_weights["lr"]

            # CNN prediction
            if self.cnn_model:
                try:
                    from tensorflow.keras.preprocessing.sequence import pad_sequences
                    seq = self.sentiment_tokenizer.texts_to_sequences([clean])
                    pad = pad_sequences(seq, maxlen=150, padding="post", truncating="post")
                    cnn_proba = self.cnn_model.predict(pad, verbose=0)[0]
                    ensemble_proba = ensemble_proba + cnn_proba * self.sent_weights["cnn"]
                except Exception as e:
                    logger.warning(f"CNN prediction skipped: {e}")

            # BiLSTM prediction
            if self.bilstm_model:
                try:
                    from tensorflow.keras.preprocessing.sequence import pad_sequences
                    seq = self.sentiment_tokenizer.texts_to_sequences([clean])
                    pad = pad_sequences(seq, maxlen=150, padding="post", truncating="post")
                    bl_proba = self.bilstm_model.predict(pad, verbose=0)[0]
                    ensemble_proba = ensemble_proba + bl_proba * self.sent_weights["bilstm"]
                except Exception as e:
                    logger.warning(f"BiLSTM prediction skipped: {e}")

            # Renormalize
            total = ensemble_proba.sum()
            if total > 0:
                ensemble_proba = ensemble_proba / total

            predicted_idx  = int(np.argmax(ensemble_proba))
            predicted_label = classes[predicted_idx]
            confidence      = float(ensemble_proba[predicted_idx])

            # Crisis keyword override
            keywords_found = [kw for kw in self._crisis_keywords if kw in text_lower]
            crisis_detected = len(keywords_found) > 0
            if crisis_detected and predicted_label not in ("CRITICAL", "HIGH_DISTRESS"):
                predicted_label = "CRITICAL"
                crisis_detected = True

            distress_map = {"SAFE": 1, "LOW": 3, "MODERATE": 5, "HIGH_DISTRESS": 8, "CRITICAL": 10}
            distress_level = distress_map.get(predicted_label, 5)

            return {
                "success": True,
                "sentiment": predicted_label,
                "confidence": round(confidence, 4),
                "distress_level": distress_level,
                "crisis_detected": crisis_detected,
                "crisis_keywords_found": keywords_found,
                "recommended_actions": self._get_sentiment_recommendations(predicted_label),
            }

        except Exception as e:
            logger.error(f"Sentiment error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _get_sentiment_recommendations(self, sentiment):
        recs = {
            "CRITICAL": [
                "Immediate safety concern detected",
                "Consider activating Emergency SOS",
                "Contact crisis hotline: 1195 (24/7)",
                "Do not delete this entry — it may be evidence",
            ],
            "HIGH_DISTRESS": [
                "High stress level detected",
                "Talk to a counselor within 24 hours",
                "Review your safety plan",
                "Reach out to your support network",
            ],
            "MODERATE": [
                "Moderate stress detected",
                "Consider speaking with a counselor",
                "Practice self-care activities",
                "Document concerning incidents",
            ],
            "LOW": [
                "Managing well",
                "Continue current support measures",
                "Stay connected with resources",
                "Keep documenting your journey",
            ],
            "SAFE": [
                "Positive progress noted",
                "Continue healing process",
                "Celebrate your strength",
                "Support others when ready",
            ],
        }
        return recs.get(sentiment, recs["MODERATE"])

    # -------------------------------------------------------------------------
    # RECOMMENDATIONS
    # -------------------------------------------------------------------------

    def recommend_resources(self, profile, resources):
        try:
            recommendations = []
            for resource in resources:
                score = 0
                reasons = []

                rl = profile.get("risk_level", "LOW")
                rt = resource.get("type", "")

                if rl == "CRITICAL" and rt in ["Emergency Shelter", "Police GBV Desk", "Crisis Hotline"]:
                    score += 0.40
                    reasons.append(f"Emergency {rt} for critical situations")
                elif rl == "HIGH" and rt in ["Safe House", "Legal Aid", "Psychosocial Counseling"]:
                    score += 0.30
                    reasons.append(f"{rt} for high-risk situations")
                elif rl in ("MODERATE", "LOW") and rt in ["Psychosocial Counseling", "Economic Empowerment"]:
                    score += 0.20
                    reasons.append(f"{rt} recommended for your situation")

                if profile.get("has_children") and resource.get("accepts_children"):
                    score += 0.25
                    reasons.append("Child-friendly services available")

                if profile.get("needs_immediate") and resource.get("available_24_7"):
                    score += 0.20
                    reasons.append("Available 24/7 for immediate help")

                if resource.get("county") == profile.get("preferred_county"):
                    score += 0.15
                    reasons.append(f"Located in {resource.get('county', 'your area')}")

                score += resource.get("rating", 3) / 5 * 0.10
                if resource.get("response_time_hours", 99) < 2:
                    score += 0.10
                    reasons.append("Fast response time")

                recommendations.append({
                    **resource,
                    "match_score": round(float(score), 4),
                    "match_percentage": min(int(score * 100), 100),
                    "match_reasons": reasons,
                })

            recommendations.sort(key=lambda x: x["match_score"], reverse=True)
            return {
                "success": True,
                "recommendations": recommendations[:5],
                "total_matched": len(recommendations),
            }

        except Exception as e:
            logger.error(f"Recommendation error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # -------------------------------------------------------------------------
    # CHATBOT
    # -------------------------------------------------------------------------

    def start_chatbot_session(self):
        try:
            session_id = f"sess_{uuid.uuid4().hex[:12]}"
            self.chatbot_sessions[session_id] = {
                "current_question": 0,
                "answers": {},
                "risk_score": 0,
                "started_at": datetime.utcnow().isoformat(),
            }
            first_q = self.chatbot_config["questions"][0]
            return {
                "success": True,
                "session_id": session_id,
                "question": first_q,
                "progress": 0,
                "total_questions": len(self.chatbot_config["questions"]),
            }
        except Exception as e:
            logger.error(f"Chatbot start error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def chatbot_respond(self, session_id, question_id, answer):
        try:
            if session_id not in self.chatbot_sessions:
                return {"success": False, "error": "Invalid or expired session_id"}

            session   = self.chatbot_sessions[session_id]
            questions = self.chatbot_config["questions"]
            idx       = session["current_question"]

            # Store answer
            qid = question_id or questions[idx].get("id", f"q{idx}")
            session["answers"][qid] = answer

            # Add weight if answer is affirmative
            affirmative = str(answer).lower() in ("yes", "true", "1", "da", "ndio")
            if affirmative:
                session["risk_score"] += questions[idx].get("weight", 1)

            # Check crisis on the fly
            if isinstance(answer, str):
                text_lower = answer.lower()
                crisis_hit = any(kw in text_lower for kw in self._crisis_keywords)
                if crisis_hit:
                    session["risk_score"] += 5  # bump score for in-text crisis signals

            # Advance
            session["current_question"] += 1
            if session["current_question"] >= len(questions):
                return self._finish_chatbot_session(session_id)

            next_q = questions[session["current_question"]]
            empathetic = self.chatbot_config["empathetic_responses"].get(
                qid, "Thank you for sharing that with me. I am here to help."
            )
            progress = int((session["current_question"] / len(questions)) * 100)

            return {
                "success": True,
                "empathetic_response": empathetic,
                "next_question": next_q,
                "progress": progress,
                "risk_score_current": session["risk_score"],
                "crisis_detected": session["risk_score"] >= self.chatbot_config["risk_thresholds"].get("CRITICAL", 15),
                "finished": False,
            }

        except Exception as e:
            logger.error(f"Chatbot respond error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _finish_chatbot_session(self, session_id):
        session    = self.chatbot_sessions.pop(session_id, {})
        risk_score = session.get("risk_score", 0)
        thresholds = self.chatbot_config["risk_thresholds"]

        if risk_score >= thresholds.get("CRITICAL", 15):
            risk_level = "CRITICAL"
        elif risk_score >= thresholds.get("HIGH", 10):
            risk_level = "HIGH"
        elif risk_score >= thresholds.get("MODERATE", 5):
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        recs = self._get_safety_recommendations(risk_level, session.get("answers", {}))
        return {
            "success": True,
            "finished": True,
            "risk_assessment": {
                "score":        risk_score,
                "level":        risk_level,
                "max_score":    self.chatbot_config.get("max_score", 20),
                "recommendations": recs,
            },
        }

    # -------------------------------------------------------------------------
    # TREND ANALYSIS
    # -------------------------------------------------------------------------

    def analyze_trend(self, assessments):
        try:
            if len(assessments) < 2:
                return {
                    "success": True,
                    "trend": "INSUFFICIENT_DATA",
                    "message": "Need at least 2 assessments to analyze trend",
                }

            scores = [float(a["score"]) for a in assessments]
            dates  = [datetime.fromisoformat(a["date"]) for a in assessments]

            recent_avg = float(np.mean(scores[-3:]))
            older_avg  = float(np.mean(scores[:-3])) if len(scores) > 3 else scores[0]
            change     = recent_avg - older_avg

            if change > 5:
                trend, message, alert = "ESCALATING", "WARNING: Risk is escalating rapidly. Immediate action recommended.", "CRITICAL"
            elif change > 2:
                trend, message, alert = "INCREASING",  "Risk is gradually increasing. Monitor closely.", "HIGH"
            elif change < -2:
                trend, message, alert = "IMPROVING",   "Situation appears to be improving. Continue current support.", "LOW"
            else:
                trend, message, alert = "STABLE",      "Risk level is relatively stable. Maintain vigilance.", "MODERATE"

            return {
                "success":       True,
                "trend":         trend,
                "message":       message,
                "change_amount": round(change, 2),
                "current_score": scores[-1],
                "average_score": round(float(np.mean(scores)), 2),
                "days_tracked":  (dates[-1] - dates[0]).days,
                "alert_level":   alert,
            }

        except Exception as e:
            logger.error(f"Trend error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # -------------------------------------------------------------------------
    # JOURNAL / EVIDENCE ANALYSIS  (unchanged from original)
    # -------------------------------------------------------------------------

    def analyze_journal_entry(self, text):
        try:
            sentiment_result = self.analyze_sentiment(text)
            text_lower = text.lower()

            violence_kw      = ["hit","beat","punch","slap","kick","hurt","pain","bruise"]
            weapon_kw        = ["gun","knife","weapon","firearm","blade","panga"]
            strangulation_kw = ["strangle","choke","throat","neck","breath","air"]
            fear_kw          = ["scared","afraid","terrified","fear","panic","trapped"]
            suicide_kw       = ["suicide","kill myself","end it","want to die","no point living"]

            violence_count        = sum(1 for kw in violence_kw      if kw in text_lower)
            weapon_detected       = any(kw in text_lower for kw in weapon_kw)
            strangulation_detected= any(kw in text_lower for kw in strangulation_kw)
            fear_count            = sum(1 for kw in fear_kw          if kw in text_lower)
            suicide_detected      = any(kw in text_lower for kw in suicide_kw)

            if strangulation_detected or weapon_detected or suicide_detected:
                sentiment_result["sentiment"]       = "CRITICAL"
                sentiment_result["crisis_detected"] = True

            distress_components = {
                "sentiment": sentiment_result["distress_level"] / 10,
                "violence":  min(violence_count / 3, 1.0),
                "weapon":    1.0 if weapon_detected       else 0.0,
                "strangle":  1.0 if strangulation_detected else 0.0,
                "fear":      min(fear_count / 2, 1.0),
                "suicide":   1.0 if suicide_detected       else 0.0,
            }
            overall_distress = int(np.mean(list(distress_components.values())) * 10)

            return {
                "success":         True,
                "type":            "journal",
                "sentiment":       sentiment_result["sentiment"],
                "confidence":      sentiment_result["confidence"],
                "distress_level":  overall_distress,
                "crisis_detected": sentiment_result["crisis_detected"],
                "indicators": {
                    "violence":          violence_count > 0,
                    "violence_count":    violence_count,
                    "weapons":           weapon_detected,
                    "strangulation":     strangulation_detected,
                    "high_fear":         fear_count > 1,
                    "suicidal_ideation": suicide_detected,
                },
                "recommended_actions":        self._get_journal_recommendations(
                    sentiment_result["sentiment"], violence_count > 0,
                    weapon_detected, strangulation_detected, suicide_detected),
                "analysis_timestamp":         datetime.utcnow().isoformat(),
                "requires_immediate_action":  strangulation_detected or suicide_detected or weapon_detected,
            }

        except Exception as e:
            logger.error(f"Journal analysis error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _get_journal_recommendations(self, sentiment, has_violence, has_weapons,
                                      has_strangulation, has_suicide):
        if has_strangulation:
            return [
                "CRITICAL: Strangulation is the #1 predictor of homicide",
                "CALL 999 IMMEDIATELY if in danger",
                "SEEK medical attention — internal injuries may not be visible",
                "FILE POLICE REPORT — this is evidence of attempted murder",
            ]
        if has_suicide:
            return [
                "URGENT: Suicidal thoughts detected",
                "CRISIS HOTLINE: 1195 (24/7, free, confidential)",
                "SEEK immediate mental health support",
                "REACH OUT to trusted friend or family member NOW",
            ]
        if has_weapons:
            return [
                "HIGH RISK: Weapon access significantly increases danger",
                "ACTIVATE Emergency SOS if you feel unsafe",
                "CONTACT Police Gender Desk: 999",
                "SECURE safe place to go immediately",
            ]
        if has_violence or sentiment == "CRITICAL":
            return [
                "IMMEDIATE: Activate Emergency SOS if needed",
                "CALL: Police (999) or GBV Hotline (1195)",
                "DOCUMENT: Seek medical documentation of injuries",
                "SAVE: This entry as court evidence",
            ]
        if sentiment == "HIGH_DISTRESS":
            return [
                "SAFETY: Review your safety plan today",
                "SUPPORT: Contact counselor or shelter within 24h",
                "LEGAL: Consider protection order options",
                "DOCUMENT: Continue recording all incidents",
            ]
        if sentiment == "MODERATE":
            return [
                "PLAN: Create or update safety plan",
                "TALK: Speak with counselor this week",
                "NETWORK: Build your support system",
                "LEARN: Know your legal rights",
            ]
        return [
            "CONTINUE: Keep building strength",
            "STAY: Connected with resources",
            "DOCUMENT: Your healing journey",
            "CELEBRATE: Your progress",
        ]

    def analyze_photo_evidence(self, photo_metadata):
        try:
            timestamp = photo_metadata.get("timestamp", datetime.utcnow().isoformat())
            location  = photo_metadata.get("location", "Unknown")
            has_gps   = "GPS:" in location and location != "GPS: Location unavailable"

            hours_ago, is_recent = None, False
            if timestamp:
                try:
                    t = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    hours_ago = (datetime.utcnow() - t.replace(tzinfo=None)).total_seconds() / 3600
                    is_recent = hours_ago < 24
                except Exception:
                    pass

            if is_recent and has_gps:
                priority, quality = "HIGH",   "EXCELLENT"
            elif is_recent or has_gps:
                priority, quality = "MEDIUM", "GOOD"
            else:
                priority, quality = "LOW",    "FAIR"

            recs = ["Photo timestamped and encrypted", "Add detailed written description", "Evidence court-admissible"]
            if has_gps:  recs.append("GPS location recorded")
            else:        recs.append("Add location details manually")
            if is_recent:
                recs += ["Seek medical documentation within 72h", "Photo supports police report", "Consider legal consultation"]

            return {
                "success": True, "type": "photo", "priority": priority,
                "evidence_quality": quality, "has_timestamp": bool(timestamp),
                "has_gps": has_gps, "is_recent": is_recent,
                "hours_since_capture": hours_ago, "location": location,
                "recommended_actions": recs,
                "analysis_timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Photo analysis error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def analyze_audio_evidence(self, audio_metadata):
        try:
            timestamp = audio_metadata.get("timestamp", datetime.utcnow().isoformat())
            duration  = audio_metadata.get("duration", 0)

            hours_ago, is_recent = None, False
            if timestamp:
                try:
                    t = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    hours_ago = (datetime.utcnow() - t.replace(tzinfo=None)).total_seconds() / 3600
                    is_recent = hours_ago < 24
                except Exception:
                    pass

            if duration > 30 and is_recent: priority, quality = "HIGH",   "EXCELLENT"
            elif duration > 10 or is_recent: priority, quality = "MEDIUM", "GOOD"
            else:                            priority, quality = "LOW",    "FAIR"

            recs = ["Audio timestamped and encrypted", "Add transcript or description of content", "Recording protected and admissible"]
            if duration > 30: recs.append("Substantial duration recorded")
            if is_recent:     recs += ["Consider medical/police report", "Strong evidence for legal proceedings"]

            return {
                "success": True, "type": "audio", "priority": priority,
                "evidence_quality": quality, "duration_seconds": duration,
                "has_timestamp": bool(timestamp), "is_recent": is_recent,
                "hours_since_recording": hours_ago,
                "recommended_actions": recs,
                "analysis_timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Audio analysis error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def analyze_evidence_collection(self, evidence_items):
        try:
            photos  = [e for e in evidence_items if e.get("type") == "photo"]
            audio   = [e for e in evidence_items if e.get("type") == "audio"]
            journal = [e for e in evidence_items if e.get("type") == "journal"]

            completeness = (33 if photos else 0) + (33 if audio else 0) + (34 if journal else 0)

            has_recent = False
            for e in evidence_items:
                ts = e.get("timestamp")
                if ts:
                    try:
                        t = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                        if (datetime.utcnow() - t.replace(tzinfo=None)).total_seconds() < 86400:
                            has_recent = True
                            break
                    except Exception:
                        continue

            if completeness >= 66 and has_recent: strength = "STRONG"
            elif completeness >= 33:              strength = "MODERATE"
            else:                                 strength = "WEAK"

            recs = []
            if not photos:  recs.append("Add photo evidence of injuries/damage")
            if not journal: recs.append("Document incidents in journal")
            if not audio:   recs.append("Record audio when safe to do so")

            if strength == "STRONG":
                recs += ["Strong evidence collection", "Consult with legal aid (FIDA Kenya)",
                         "Evidence ready for police report", "Consider medical documentation"]
            elif strength == "MODERATE":
                recs += ["Good start — continue documenting", "Add more diverse evidence types", "Learn about legal options"]
            else:
                recs += ["Start documenting all incidents", "Capture photo evidence safely", "Build comprehensive evidence file"]

            return {
                "success": True,
                "total_items": len(evidence_items),
                "by_type": {"photos": len(photos), "audio": len(audio), "journal": len(journal)},
                "completeness_score": completeness,
                "overall_strength": strength,
                "has_recent_evidence": has_recent,
                "recommendations": recs,
                "legal_readiness": strength in ("STRONG", "MODERATE"),
                "analysis_timestamp": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            logger.error(f"Evidence collection error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}