import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret-key')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # Models
    MODELS_DIR = Path(os.getenv('MODELS_DIR', './models'))
    RISK_MODEL_DIR = MODELS_DIR / 'risk_escalation'
    SENTIMENT_MODEL_DIR = MODELS_DIR / 'sentiment'
    RECOMMENDATION_MODEL_DIR = MODELS_DIR / 'recommendation'
    CHATBOT_CONFIG_PATH = MODELS_DIR / 'chatbot' / 'config.json'
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'halo_backend.log')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL')
    
    # Email
    SMTP_SERVER = os.getenv('SMTP_SERVER')
    SMTP_PORT = os.getenv('SMTP_PORT', 587)
    SMTP_USERNAME = os.getenv('SMTP_USERNAME')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

