from flask import Blueprint, request, jsonify, current_app
import logging

logger = logging.getLogger(__name__)
ml_bp = Blueprint('ml', __name__)

@ml_bp.route('/predict-escalation', methods=['POST'])
def predict_escalation():
    """Predict risk escalation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Get ML service
        ml_service = current_app.ml_service
        
        if not ml_service:
            return jsonify({
                'success': False,
                'error': 'ML service not initialized'
            }), 500
        
        # Make prediction
        result = ml_service.predict_escalation(data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in predict_escalation: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ml_bp.route('/recommend-resources', methods=['POST'])
def recommend_resources():
    """Recommend resources based on user profile"""
    try:
        data = request.get_json()
        
        if not data or 'profile' not in data:
            return jsonify({
                'success': False,
                'error': 'Profile data required'
            }), 400
        
        ml_service = current_app.ml_service
        result = ml_service.recommend_resources(
            data['profile'],
            data.get('resources', [])
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in recommend_resources: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ml_bp.route('/analyze-sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of journal entry"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Text field required'
            }), 400
        
        ml_service = current_app.ml_service
        result = ml_service.analyze_sentiment(data['text'])
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in analyze_sentiment: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ml_bp.route('/chatbot/start', methods=['POST'])
def chatbot_start():
    """Start new chatbot session"""
    try:
        ml_service = current_app.ml_service
        result = ml_service.start_chatbot_session()
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in chatbot_start: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ml_bp.route('/chatbot/respond', methods=['POST'])
def chatbot_respond():
    """Process chatbot response"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data or 'answer' not in data:
            return jsonify({
                'success': False,
                'error': 'session_id and answer required'
            }), 400
        
        ml_service = current_app.ml_service
        result = ml_service.chatbot_respond(
            data['session_id'],
            data.get('question_id'),
            data['answer']
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in chatbot_respond: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ml_bp.route('/analyze-trend', methods=['POST'])
def analyze_trend():
    """Analyze risk trend over time"""
    try:
        data = request.get_json()
        
        if not data or 'assessments' not in data:
            return jsonify({
                'success': False,
                'error': 'assessments array required'
            }), 400
        
        ml_service = current_app.ml_service
        result = ml_service.analyze_trend(data['assessments'])
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in analyze_trend: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

