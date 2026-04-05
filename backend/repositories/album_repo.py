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
        if album.child_count is not None:
            existing.child_count = album.child_count
        if album.drive_modified_time is not None:
            existing.drive_modified_time = album.drive_modified_time
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


def get_by_parent(
    session: Session,
    parent_id: str,
    include_excluded: bool = False,
) -> list[DriveAlbum]:
    stmt = (
        select(DriveAlbum)
        .where(DriveAlbum.parent_id == parent_id)
        .order_by(DriveAlbum.name)
    )
    if not include_excluded:
        stmt = stmt.where(DriveAlbum.excluded == False)  # noqa: E712
    return list(session.exec(stmt).all())


def get_root_albums(
    session: Session,
    include_excluded: bool = False,
) -> list[DriveAlbum]:
    stmt = (
        select(DriveAlbum)
        .where(DriveAlbum.parent_id.is_(None))
        .order_by(DriveAlbum.name)
    )
    if not include_excluded:
        stmt = stmt.where(DriveAlbum.excluded == False)  # noqa: E712
    return list(session.exec(stmt).all())


def set_excluded(session: Session, album_id: str, excluded: bool) -> DriveAlbum | None:
    album = session.get(DriveAlbum, album_id)
    if not album:
        return None
    album.excluded = excluded
    session.add(album)
    session.commit()
    session.refresh(album)
    return album


def count_all(session: Session) -> int:
    return len(session.exec(select(DriveAlbum)).all())
