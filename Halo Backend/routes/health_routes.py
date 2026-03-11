from flask import Blueprint, jsonify
from datetime import datetime
import os
from pathlib import Path

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    
    # Check if model files exist (matching actual filenames)
    models_loaded = {
        'risk_escalation': all([
            Path('models/risk_escalation/risk_escalation_rf_model.pkl').exists(),
            Path('models/risk_escalation/risk_escalation_scaler.pkl').exists(),
            Path('models/risk_escalation/config.json').exists()
        ]),
        'sentiment': all([
            Path('models/sentiment/tfidf_vectorizer.pkl').exists(),
            Path('models/sentiment/lr_model.pkl').exists(),
            Path('models/sentiment/config.json').exists()
        ]),
        'recommendation': all([
            Path('models/recommendation/user_similarity.pkl').exists(),
            Path('models/recommendation/resources_df.pkl').exists()
        ]),
        'chatbot': Path('models/chatbot/chatbot_config.json').exists()
    }
    
    # At least core models should be loaded
    core_healthy = models_loaded['sentiment'] and models_loaded['chatbot']
    
    return jsonify({
        'status': 'healthy' if core_healthy else 'degraded',
        'timestamp': datetime.utcnow().isoformat(),
        'models_loaded': models_loaded,
        'version': '1.0.0'
    })