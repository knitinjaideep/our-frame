from datetime import datetime
from sqlmodel import Session, select
from models.album import DriveAlbum


def upsert(session: Session, album: DriveAlbum) -> DriveAlbum:
    existing = session.get(DriveAlbum, album.id)
    if existing:
        existing.name = album.name
        existing.parent_id = album.parent_id
        if album.cover_photo_id:
            existing.cover_photo_id = album.cover_photo_id
        if album.photo_count is not None:
            existing.photo_count = album.photo_count
        existing.last_synced = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    session.add(album)
    session.commit()
    session.refresh(album)
    return album


def get_by_id(session: Session, album_id: str) -> DriveAlbum | None:
    return session.get(DriveAlbum, album_id)


def get_by_parent(session: Session, parent_id: str) -> list[DriveAlbum]:
    return list(
        session.exec(
            select(DriveAlbum)
            .where(DriveAlbum.parent_id == parent_id)
            .order_by(DriveAlbum.name)
        ).all()
    )


def get_root_albums(session: Session) -> list[DriveAlbum]:
    return list(
        session.exec(
            select(DriveAlbum)
            .where(DriveAlbum.parent_id.is_(None))
            .order_by(DriveAlbum.name)
        ).all()
    )


def count_all(session: Session) -> int:
    return len(session.exec(select(DriveAlbum)).all())
