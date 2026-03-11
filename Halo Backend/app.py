"""
app.py  —  production entry point
Swap to lazy ML loading when running on free-tier cloud (LAZY_LOAD_MODELS=true)
"""
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ── choose ML service based on environment ────────────────────────────────────
if os.getenv("LAZY_LOAD_MODELS", "false").lower() == "true":
    logger.info("Using lazy-load ML service (free-tier mode)")
    from services.ml_service_lazy import MLService
else:
    from services.ml_service import MLService

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "https://halo-guardian-network.vercel.app"),
]

CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)

# ── log every request/response ───────────────────────────────────────────────
@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} - {request.remote_addr}")

@app.after_request
def log_response(response):
    logger.info(f"Response: {response.status_code}")
    return response

# ── initialise ML service ─────────────────────────────────────────────────────
logger.info("🚀 Initializing HALO Backend...")
try:
    ml_service = MLService()
    logger.info("✅ ML Service initialized successfully")
except Exception as e:
    logger.error(f"❌ ML Service failed to initialize: {e}")
    ml_service = None

# ── routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    return jsonify({
        "status": "healthy",
        "ml_ready": ml_service is not None and ml_service.models_loaded,
        "tf_loaded": getattr(ml_service, "_tf_loaded", False) if ml_service else False,
    })


@app.route("/api/predict-escalation", methods=["POST", "OPTIONS"])
def predict_escalation():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.predict_escalation(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"predict_escalation error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-sentiment", methods=["POST", "OPTIONS"])
def analyze_sentiment():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.analyze_sentiment(data.get("text", ""))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_sentiment error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-journal", methods=["POST", "OPTIONS"])
def analyze_journal():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.analyze_journal_entry(data.get("text", ""))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_journal error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/recommend-resources", methods=["POST", "OPTIONS"])
def recommend_resources():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.recommend_resources(data.get("profile", {}), data.get("resources", []))
        return jsonify(result)
    except Exception as e:
        logger.error(f"recommend_resources error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-trend", methods=["POST", "OPTIONS"])
def analyze_trend():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.analyze_trend(data.get("assessments", []))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_trend error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chatbot/start", methods=["POST", "OPTIONS"])
def chatbot_start():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.start_chatbot_session()
        return jsonify(result)
    except Exception as e:
        logger.error(f"chatbot_start error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chatbot/respond", methods=["POST", "OPTIONS"])
def chatbot_respond():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.chatbot_respond(
            data.get("session_id"),
            data.get("question_id"),
            data.get("answer")
        )
        return jsonify(result)
    except Exception as e:
        logger.error(f"chatbot_respond error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-evidence", methods=["POST", "OPTIONS"])
def analyze_evidence():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        data = request.get_json()
        result = ml_service.analyze_evidence_collection(data.get("evidence", []))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_evidence error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


# ── entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    logger.info(f"🚀 Starting HALO Backend on port {port}")
    logger.info(f"🔧 Debug mode: {debug}")
    app.run(host="0.0.0.0", port=port, debug=debug)