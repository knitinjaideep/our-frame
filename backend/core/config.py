from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    # Used for the per-user Drive connect flow
    google_drive_oauth_redirect: str = "http://localhost:8000/api/drive/callback"
    # Legacy single-user redirect — kept for backward compat during migration
    google_oauth_redirect: str = "http://localhost:8000/auth/callback"
    # Legacy single-user token path — kept for backward compat
    google_token_path: str = "token.json"

    # Legacy single-user Drive root — kept for backward compat
    root_folder_id: str = ""
    google_drive_root_folder: Optional[str] = None

    # App
    frontend_root: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data/ourframe.db"
    debug: bool = False

    # Session
    # Generate a strong random secret: python -c "import secrets; print(secrets.token_hex(32))"
    session_secret: str = "change-me-in-production-use-a-long-random-string"
    # Session lifetime in seconds (default 7 days)
    session_ttl_seconds: int = 604800

    # Token encryption key for DriveConnection tokens.
    # Must be 32 url-safe base64 chars.  Generate with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # If empty, tokens are stored base64-only (local dev only — NOT safe for prod).
    token_encryption_key: str = ""

    # AI (optional, all off by default)
    openai_api_key: Optional[str] = None
    ai_enabled: bool = False

    @property
    def effective_root_folder(self) -> str:
        """Legacy compat — used by the single-user sync path only."""
        return self.google_drive_root_folder or self.root_folder_id


settings = Settings()
