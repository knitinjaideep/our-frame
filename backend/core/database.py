from pathlib import Path
from sqlmodel import SQLModel, create_engine, Session
from .config import settings


def _get_engine():
    db_url = settings.database_url
    connect_args = {}

    if db_url.startswith("sqlite:///"):
        # Ensure the data/ directory exists for SQLite
        db_path = Path(db_url.replace("sqlite:///", ""))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        # SQLite requires this in a multithreaded FastAPI app
        connect_args = {"check_same_thread": False}

    return create_engine(
        db_url,
        echo=settings.debug,
        connect_args=connect_args,
    )


engine = _get_engine()


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
