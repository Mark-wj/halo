import logging
import threading
import json
from pathlib import Path

logger = logging.getLogger(__name__)

from services.ml_service import MLService as _RealMLService


class MLService(_RealMLService):
    """MLService with lazy TensorFlow loading — safe for 512MB free-tier."""

    def __init__(self):
        logger.info("Initializing ML Service (lazy-load mode)...")
        self.models_loaded    = False
        self.chatbot_sessions = {}
        self._tf_lock         = threading.Lock()
        self._tf_loaded       = False

        # Null-safe defaults so nothing is ever undefined
        self.rf_model = self.xgb_model = self.lgbm_model = None
        self.risk_scaler = None
        self.risk_config = {}
        self.risk_weights = {"rf": 0.25, "xgb": 0.25, "lgbm": 0.25, "nn": 0.25}
        self.nn_model = None

        self.tfidf_vectorizer = self.lr_model = None
        self.sentiment_label_encoder = self.sentiment_tokenizer = None
        self.sentiment_config = {}
        self.sent_weights = {"lr": 0.333, "cnn": 0.333, "bilstm": 0.334}
        self._crisis_keywords = []
        self.cnn_model = self.bilstm_model = None

        try:
            self._load_risk_models_lazy()
        except Exception as e:
            logger.warning(f"Risk models unavailable: {e} — rule-based fallback active")

        try:
            self._load_sentiment_models_lazy()
        except Exception as e:
            logger.warning(f"Sentiment models unavailable: {e} — keyword fallback active")

        try:
            self._load_recommendation_models()
        except Exception as e:
            logger.warning(f"Recommendation models unavailable: {e}")

        try:
            self._load_chatbot_config()
        except Exception as e:
            logger.warning(f"Chatbot config unavailable: {e}")

        # Ensure _crisis_keywords always exists (populated from sentiment_config or default)
        if not self._crisis_keywords:
            self._crisis_keywords = [
                "kill", "murder", "die", "death", "suicide", "gun", "knife",
                "weapon", "firearm", "strangle", "choke", "beat", "hit",
                "hurt", "rape", "stab", "shoot", "poison", "attack", "abuse",
            ]
            logger.info("Using default crisis keywords")

        self.models_loaded = True
        logger.info(
            f"ML Service ready — "
            f"risk={'✅' if self.rf_model else '⚠️ fallback'} | "
            f"sentiment={'✅' if self.tfidf_vectorizer else '⚠️ fallback'} | "
            f"TF=deferred"
        )

    # ------------------------------------------------------------------
    # Risk models — filenames from ml_service.py _load_risk_models()
    # ------------------------------------------------------------------

    def _load_risk_models_lazy(self):
        import joblib
        base = Path("models/risk_escalation")

        self.rf_model    = joblib.load(base / "risk_rf.pkl")
        self.xgb_model   = joblib.load(base / "risk_xgb_clean.pkl")
        self.lgbm_model  = joblib.load(base / "risk_lgbm.pkl")
        self.risk_scaler = joblib.load(base / "risk_scaler.pkl")

        # Match ml_service.py: prefer risk_config.json, fall back to config.json
        config_path = base / "risk_config.json"
        if not config_path.exists():
            config_path = base / "config.json"

        content = config_path.read_text().strip()
        if content and not content.startswith("version https://git-lfs"):
            self.risk_config = json.loads(content)
        else:
            logger.warning("risk config is empty or LFS pointer — using default weights")
            self.risk_config = {}

        w = self.risk_config.get("weights", {})
        self.risk_weights = {
            "rf":   w.get("rf",   w.get("random_forest",  0.25)),
            "xgb":  w.get("xgb",  w.get("xgboost",        0.25)),
            "lgbm": w.get("lgbm", w.get("lightgbm",        0.25)),
            "nn":   w.get("nn",   w.get("neural_network",  0.25)),
        }
        total = sum(self.risk_weights.values()) or 1
        self.risk_weights = {k: v / total for k, v in self.risk_weights.items()}

        self.nn_model = None  # TF deferred
        logger.info("Risk sklearn models loaded; NN deferred")

    # ------------------------------------------------------------------
    # Sentiment models — filenames from ml_service.py _load_sentiment_models()
    # ------------------------------------------------------------------

    def _load_sentiment_models_lazy(self):
        import joblib
        base = Path("models/sentiment")

        self.tfidf_vectorizer        = joblib.load(base / "sentiment_tfidf.pkl")
        self.lr_model                = joblib.load(base / "sentiment_lr.pkl")
        self.sentiment_label_encoder = joblib.load(base / "sentiment_encoder.pkl")
        self.sentiment_tokenizer     = joblib.load(base / "sentiment_tokenizer.pkl")

        with open(base / "sentiment_config.json") as f:
            self.sentiment_config = json.load(f)

        # Build _crisis_keywords exactly as ml_service.py does
        raw_kw = self.sentiment_config.get("crisis_keywords", [])
        if isinstance(raw_kw, dict):
            flat = []
            for v in raw_kw.values():
                flat.extend(v)
            self._crisis_keywords = flat
        else:
            self._crisis_keywords = list(raw_kw)

        # Ensemble weights from config
        perf = self.sentiment_config.get("weights", {})
        self.sent_weights = {
            "lr":     perf.get("logistic_regression", 0.333),
            "cnn":    perf.get("cnn",    0.333),
            "bilstm": perf.get("bilstm", 0.334),
        }

        # DL models deferred
        self.cnn_model    = None
        self.bilstm_model = None
        logger.info("Sentiment sklearn models loaded; DL models deferred")

    # ------------------------------------------------------------------
    # On-demand TF loader — filenames from ml_service.py _load_sentiment_models()
    # ------------------------------------------------------------------

    def _ensure_tf_loaded(self):
        if self._tf_loaded:
            return
        with self._tf_lock:
            if self._tf_loaded:
                return
            logger.info("Loading TensorFlow models on first request...")
            try:
                import tensorflow as tf
                base_risk = Path("models/risk_escalation")
                base_sent = Path("models/sentiment")

                # Risk NN
                nn_path = base_risk / "risk_nn.h5"
                if nn_path.exists():
                    self.nn_model = tf.keras.models.load_model(nn_path)
                    logger.info("Risk NN loaded")
                else:
                    logger.warning("risk_nn.h5 not found — NN disabled")

                # CNN — try both filenames that ml_service.py supports
                for cnn_name in ("sentiment_cnn_lstm_model.h5", "sentiment_cnn.keras"):
                    p = base_sent / cnn_name
                    if p.exists():
                        self.cnn_model = tf.keras.models.load_model(p)
                        logger.info(f"CNN loaded from {cnn_name}")
                        break

                # BiLSTM — try both filenames
                for bl_name in ("sentiment_bilstm_model.h5", "sentiment_bilstm.keras"):
                    p = base_sent / bl_name
                    if p.exists():
                        self.bilstm_model = tf.keras.models.load_model(p)
                        logger.info(f"BiLSTM loaded from {bl_name}")
                        break

                self._tf_loaded = True
                logger.info(
                    f"TF load complete — "
                    f"NN:{self.nn_model is not None} "
                    f"CNN:{self.cnn_model is not None} "
                    f"BiLSTM:{self.bilstm_model is not None}"
                )
            except Exception as e:
                logger.warning(f"TF models failed: {e} — continuing with sklearn only")
                self._tf_loaded = True  # don't retry on every request

    # ------------------------------------------------------------------
    # Override inference methods to trigger lazy TF load
    # ------------------------------------------------------------------

    def predict_escalation(self, assessment_data):
        self._ensure_tf_loaded()
        return super().predict_escalation(assessment_data)

    def analyze_sentiment(self, text):
        self._ensure_tf_loaded()
        return super().analyze_sentiment(text)

    def analyze_journal_entry(self, text):
        self._ensure_tf_loaded()
        return super().analyze_journal_entry(text)