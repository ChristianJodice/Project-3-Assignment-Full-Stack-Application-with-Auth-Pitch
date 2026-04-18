import os

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from gearledger.config import Config
from gearledger.models import db


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    JWTManager(app)

    origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS(
        app,
        resources={r"/api/*": {"origins": [o.strip() for o in origins.split(",") if o.strip()]}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )

    from gearledger.auth_routes import bp as auth_bp
    from gearledger.equipment_routes import bp as equipment_bp
    from gearledger.checkout_routes import bp as checkout_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(equipment_bp, url_prefix="/api/equipment")
    app.register_blueprint(checkout_bp, url_prefix="/api/checkouts")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    with app.app_context():
        db.create_all()

    return app
