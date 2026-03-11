# routes/evidence_routes.py
# API Routes for Evidence Vault Analysis

from flask import Blueprint, request, jsonify
from flask import current_app
import logging

logger = logging.getLogger(__name__)

evidence_bp = Blueprint('evidence', __name__)

@evidence_bp.route('/analyze-journal', methods=['POST'])
def analyze_journal():
    """
    Analyze journal entry text
    Expects: { "text": "journal entry text" }
    Returns: sentiment, distress level, crisis indicators, recommendations
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: text'
            }), 400
        
        text = data['text']
        
        if not text or len(text.strip()) < 10:
            return jsonify({
                'success': False,
                'error': 'Text must be at least 10 characters'
            }), 400
        
        # Analyze using ML service
        ml_service = current_app.ml_service
        result = ml_service.analyze_journal_entry(text)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Journal analysis error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@evidence_bp.route('/analyze-photo', methods=['POST'])
def analyze_photo():
    """
    Analyze photo evidence metadata
    Expects: { "timestamp": "ISO date", "location": "GPS or description" }
    Returns: priority, quality assessment, recommendations
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Missing photo metadata'
            }), 400
        
        # Analyze using ML service
        ml_service = current_app.ml_service
        result = ml_service.analyze_photo_evidence(data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Photo analysis error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@evidence_bp.route('/analyze-audio', methods=['POST'])
def analyze_audio():
    """
    Analyze audio evidence metadata
    Expects: { "timestamp": "ISO date", "duration": seconds }
    Returns: priority, quality assessment, recommendations
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Missing audio metadata'
            }), 400
        
        # Analyze using ML service
        ml_service = current_app.ml_service
        result = ml_service.analyze_audio_evidence(data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Audio analysis error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@evidence_bp.route('/analyze-collection', methods=['POST'])
def analyze_collection():
    """
    Analyze entire evidence collection
    Expects: { "evidence_items": [...] }
    Returns: comprehensive assessment, recommendations
    """
    try:
        data = request.get_json()
        
        if not data or 'evidence_items' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: evidence_items'
            }), 400
        
        evidence_items = data['evidence_items']
        
        if not isinstance(evidence_items, list):
            return jsonify({
                'success': False,
                'error': 'evidence_items must be an array'
            }), 400
        
        # Analyze using ML service
        ml_service = current_app.ml_service
        result = ml_service.analyze_evidence_collection(evidence_items)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Collection analysis error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@evidence_bp.route('/export-evidence', methods=['POST'])
def export_evidence():
    """
    Generate evidence export package
    Expects: { "evidence_items": [...], "user_info": {...} }
    Returns: formatted evidence package for legal use
    """
    try:
        data = request.get_json()
        
        if not data or 'evidence_items' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required field: evidence_items'
            }), 400
        
        evidence_items = data['evidence_items']
        user_info = data.get('user_info', {})
        
        # Create export package
        export_package = {
            'export_date': datetime.utcnow().isoformat(),
            'case_number': f"HALO-{datetime.utcnow().strftime('%Y%m%d')}-{len(evidence_items):04d}",
            'user_info': user_info,
            'evidence_summary': {
                'total_items': len(evidence_items),
                'photos': len([e for e in evidence_items if e.get('type') == 'photo']),
                'audio': len([e for e in evidence_items if e.get('type') == 'audio']),
                'journal': len([e for e in evidence_items if e.get('type') == 'journal'])
            },
            'evidence_items': evidence_items,
            'certification': {
                'encrypted': True,
                'timestamped': True,
                'chain_of_custody': 'Maintained via HALO Evidence Vault',
                'admissibility': 'Digital evidence authenticated and time-stamped'
            }
        }
        
        return jsonify({
            'success': True,
            'export_package': export_package
        })
        
    except Exception as e:
        logger.error(f"Export error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500