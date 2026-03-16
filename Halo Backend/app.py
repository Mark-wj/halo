"""
app.py — production entry point
"""
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

if os.getenv("LAZY_LOAD_MODELS", "false").lower() == "true":
    logger.info("Using lazy-load ML service (free-tier mode)")
    from services.ml_service_lazy import MLService
else:
    from services.ml_service import MLService

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Hardcode all known frontend origins.
# Add new Vercel URLs here if the project ever gets redeployed under a new name.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://halo001.vercel.app",          # permanent production URL
    "https://haloai-blush.vercel.app",     # previous deployment
    "https://halov10.vercel.app",          # previous deployment
    "https://halo1.vercel.app/",
]

# Add any extra origin from env var (useful for custom domains later)
extra = os.getenv("FRONTEND_URL", "").strip()
if extra and extra not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(extra)

CORS(app, resources={r"/*": {"origins": ALLOWED_ORIGINS}}, supports_credentials=True)


# ── Manual preflight handler — belt-and-suspenders over flask-cors ────────────
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = request.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            resp = app.make_default_options_response()
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Max-Age"] = "3600"
            return resp


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    logger.info(f"Response: {response.status_code}")
    return response


@app.before_request
def log_request():
    if request.method != "OPTIONS":
        logger.info(f"{request.method} {request.path} - {request.remote_addr}")


# ── ML service ────────────────────────────────────────────────────────────────
logger.info("🚀 Initializing HALO Backend...")
try:
    ml_service = MLService()
    logger.info("✅ ML Service initialized successfully")
except Exception as e:
    logger.error(f"❌ ML Service failed to initialize: {e}")
    ml_service = None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    return jsonify({
        "status": "healthy",
        "ml_ready": ml_service is not None and ml_service.models_loaded,
        "tf_loaded": getattr(ml_service, "_tf_loaded", False) if ml_service else False,
    })


@app.route("/api/predict-escalation", methods=["POST", "OPTIONS"])
def predict_escalation():
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.predict_escalation(request.get_json())
        return jsonify(result)
    except Exception as e:
        logger.error(f"predict_escalation error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-sentiment", methods=["POST", "OPTIONS"])
def analyze_sentiment():
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.analyze_sentiment(request.get_json().get("text", ""))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_sentiment error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-journal", methods=["POST", "OPTIONS"])
def analyze_journal():
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.analyze_journal_entry(request.get_json().get("text", ""))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_journal error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/recommend-resources", methods=["POST", "OPTIONS"])
def recommend_resources():
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
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.analyze_trend(request.get_json().get("assessments", []))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_trend error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chatbot/start", methods=["POST", "OPTIONS"])
def chatbot_start():
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        return jsonify(ml_service.start_chatbot_session())
    except Exception as e:
        logger.error(f"chatbot_start error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/chatbot/respond", methods=["POST", "OPTIONS"])
def chatbot_respond():
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
    if not ml_service:
        return jsonify({"success": False, "error": "ML service unavailable"}), 503
    try:
        result = ml_service.analyze_evidence_collection(request.get_json().get("evidence", []))
        return jsonify(result)
    except Exception as e:
        logger.error(f"analyze_evidence error: {e}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") != "production"
    logger.info(f"🚀 Starting HALO Backend on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)