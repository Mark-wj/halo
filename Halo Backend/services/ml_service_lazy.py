"""
ml_service_lazy.py  —  drop-in replacement for the __init__ block in MLService.

On free-tier hosts (512 MB RAM) loading all TF models at startup crashes the
process before the health-check can pass, causing an infinite restart loop.

This module patches MLService so that:
  • sklearn / joblib models load immediately (they're small, ~20 MB total)
  • TensorFlow / Keras models load on the FIRST request that needs them
  • A /health endpoint still returns 200 instantly

Usage: in app.py replace
    from services.ml_service import MLService
with
    from services.ml_service_lazy import MLService
"""

import logging
import threading
from pathlib import Path

logger = logging.getLogger(__name__)

# We import the real class and patch its __init__
from services.ml_service import MLService as _RealMLService


class MLService(_RealMLService):
    """MLService with lazy TensorFlow loading."""

    def __init__(self):
        logger.info("Initializing ML Service (lazy-load mode)...")
        self.models_loaded = False
        self.chatbot_sessions = {}
        self._tf_lock = threading.Lock()
        self._tf_loaded = False

        try:
            self._load_risk_models_lazy()
            self._load_sentiment_models_lazy()
            self._load_recommendation_models()
            self._load_chatbot_config()
            self.models_loaded = True
            logger.info("ML Service ready (TF models will load on first use)")
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)
            raise

    # ------------------------------------------------------------------
    # Lazy risk models — load sklearn now, defer TF/Keras
    # ------------------------------------------------------------------

    def _load_risk_models_lazy(self):
        import joblib, json
        base = Path("models/risk_escalation")

        self.rf_model    = joblib.load(base / "risk_escalation_rf_model.pkl")
        self.xgb_model   = joblib.load(base / "risk_escalation_xgb_model.pkl")
        self.lgbm_model  = joblib.load(base / "risk_escalation_lgbm_model.pkl")
        self.risk_scaler = joblib.load(base / "risk_escalation_scaler.pkl")

        with open(base / "config.json") as f:
            self.risk_config = json.load(f)

        w = self.risk_config.get("weights", {})
        self.risk_weights = {
            "rf":   w.get("rf",   w.get("random_forest",  0.25)),
            "xgb":  w.get("xgb",  w.get("xgboost",        0.25)),
            "lgbm": w.get("lgbm", w.get("lightgbm",        0.25)),
            "nn":   w.get("nn",   w.get("neural_network",  0.25)),
        }
        total = sum(self.risk_weights.values()) or 1
        self.risk_weights = {k: v / total for k, v in self.risk_weights.items()}

        # NN deferred — set placeholder
        self.nn_model = None
        logger.info("Risk sklearn models loaded; NN deferred")

    def _load_sentiment_models_lazy(self):
        import joblib
        base = Path("models/sentiment")

        self.tfidf_vectorizer        = joblib.load(base / "tfidf_vectorizer.pkl")
        self.lr_model                = joblib.load(base / "lr_model.pkl")
        self.sentiment_label_encoder = joblib.load(base / "label_encoder.pkl")
        self.sentiment_tokenizer     = joblib.load(base / "tokenizer.pkl")

        # DL models deferred
        self.cnn_model   = None
        self.bilstm_model = None
        logger.info("Sentiment sklearn models loaded; DL models deferred")

    # ------------------------------------------------------------------
    # On-demand TF loader — thread-safe, called before any TF inference
    # ------------------------------------------------------------------

    def _ensure_tf_loaded(self):
        if self._tf_loaded:
            return
        with self._tf_lock:
            if self._tf_loaded:
                return
            logger.info("Loading TensorFlow models on first request...")
            try:
                from tensorflow import keras
                base_risk = Path("models/risk_escalation")
                base_sent = Path("models/sentiment")

                self.nn_model     = keras.models.load_model(base_risk / "risk_escalation_nn_model.h5")
                self.cnn_model    = keras.models.load_model(base_sent / "cnn_model.h5")
                self.bilstm_model = keras.models.load_model(base_sent / "bilstm_model.h5")

                self._tf_loaded = True
                logger.info("TensorFlow models loaded successfully")
            except Exception as e:
                logger.warning(f"TF models failed to load: {e} — falling back to sklearn")
                self.nn_model = self.cnn_model = self.bilstm_model = None
                self._tf_loaded = True  # don't retry on every request

    # ------------------------------------------------------------------
    # Override inference methods to trigger lazy load
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