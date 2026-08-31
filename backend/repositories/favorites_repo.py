from sqlmodel import Session, select
from models.favorite import Favorite


def get_all(session: Session, workspace_id: int | None = None) -> list[Favorite]:
    stmt = select(Favorite).order_by(Favorite.favorited_at.desc())
    if workspace_id is not None:
        stmt = stmt.where(Favorite.workspace_id == workspace_id)
    return list(
        session.exec(stmt).all()
    )


def get_by_photo_id(
    session: Session,
    photo_id: str,
    workspace_id: int | None = None,
) -> Favorite | None:
    stmt = select(Favorite).where(Favorite.photo_id == photo_id)
    if workspace_id is not None:
        stmt = stmt.where(Favorite.workspace_id == workspace_id)
    return session.exec(stmt).first()


def add(
    session: Session,
    photo_id: str,
    photo_name: str,
    folder_id: str | None = None,
    workspace_id: int | None = None,
) -> Favorite:
    fav = Favorite(
        photo_id=photo_id,
        photo_name=photo_name,
        folder_id=folder_id,
        workspace_id=workspace_id,
    )
    session.add(fav)
    session.commit()
    session.refresh(fav)
    return fav


def remove(
    session: Session,
    photo_id: str,
    workspace_id: int | None = None,
) -> bool:
    fav = get_by_photo_id(session, photo_id, workspace_id)
    if not fav:
        return False
    session.delete(fav)
    session.commit()
    return True


def get_all_photo_ids(session: Session, workspace_id: int | None = None) -> set[str]:
    stmt = select(Favorite.photo_id)
    if workspace_id is not None:
        stmt = stmt.where(Favorite.workspace_id == workspace_id)
    results = session.exec(stmt).all()
    return set(results)
