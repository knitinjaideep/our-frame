from core.database import get_session
from repositories.favorites_repo import get_all_photo_ids
from sqlmodel import Session
from fastapi import Depends


def get_db():
    yield from get_session()


def get_fav_ids(session: Session = Depends(get_db)) -> set[str]:
    return get_all_photo_ids(session)
