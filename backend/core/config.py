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
    google_oauth_redirect: str = "http://localhost:8000/auth/callback"
    google_token_path: str = "token.json"

    # Drive
    root_folder_id: str = ""
    google_drive_root_folder: Optional[str] = None

    # App
    frontend_root: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data/ourframe.db"
    debug: bool = False

    # AI (optional, all off by default)
    openai_api_key: Optional[str] = None
    ai_enabled: bool = False

    @property
    def effective_root_folder(self) -> str:
        return self.google_drive_root_folder or self.root_folder_id


settings = Settings()
