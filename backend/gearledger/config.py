import os
from datetime import timedelta

# Stable SQLite path under backend/instance/ (not cwd-dependent).
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_INSTANCE_DIR = os.path.join(_BACKEND_ROOT, "instance")
os.makedirs(_INSTANCE_DIR, exist_ok=True)
_DEFAULT_SQLITE_PATH = os.path.join(_INSTANCE_DIR, "gearledger.db").replace("\\", "/")


class Config:
    # Dev default is long enough for HS256 (use strong random values in .env for production).
    SECRET_KEY = os.environ.get(
        "SECRET_KEY", "dev-only-change-me-use-env-32chars-minimum-xx"
    )
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{_DEFAULT_SQLITE_PATH}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
