from sqlmodel import Session, select
from models.favorite import Favorite


def get_all(session: Session) -> list[Favorite]:
    return list(
        session.exec(select(Favorite).order_by(Favorite.favorited_at.desc())).all()
    )


def get_by_photo_id(session: Session, photo_id: str) -> Favorite | None:
    return session.exec(
        select(Favorite).where(Favorite.photo_id == photo_id)
    ).first()


def add(
    session: Session,
    photo_id: str,
    photo_name: str,
    folder_id: str | None = None,
) -> Favorite:
    fav = Favorite(photo_id=photo_id, photo_name=photo_name, folder_id=folder_id)
    session.add(fav)
    session.commit()
    session.refresh(fav)
    return fav


def remove(session: Session, photo_id: str) -> bool:
    fav = get_by_photo_id(session, photo_id)
    if not fav:
        return False
    session.delete(fav)
    session.commit()
    return True


def get_all_photo_ids(session: Session) -> set[str]:
    results = session.exec(select(Favorite.photo_id)).all()
    return set(results)
