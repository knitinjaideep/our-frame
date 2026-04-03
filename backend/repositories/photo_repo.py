from datetime import datetime
from sqlmodel import Session, select
from models.photo import DrivePhoto


def upsert(session: Session, photo: DrivePhoto) -> DrivePhoto:
    existing = session.get(DrivePhoto, photo.id)
    if existing:
        existing.name = photo.name
        existing.mime_type = photo.mime_type
        existing.parent_folder_id = photo.parent_folder_id
        existing.created_time = photo.created_time
        existing.modified_time = photo.modified_time
        existing.size = photo.size
        existing.width = photo.width
        existing.height = photo.height
        existing.web_view_link = photo.web_view_link
        existing.cached_at = datetime.utcnow()
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return photo


def get_by_folder(session: Session, folder_id: str) -> list[DrivePhoto]:
    return list(
        session.exec(
            select(DrivePhoto)
            .where(DrivePhoto.parent_folder_id == folder_id)
            .order_by(DrivePhoto.created_time.desc())
        ).all()
    )


def get_by_id(session: Session, photo_id: str) -> DrivePhoto | None:
    return session.get(DrivePhoto, photo_id)


def get_by_month_day(session: Session, month: int, day: int) -> list[DrivePhoto]:
    """Return photos taken on the same calendar month+day across all years."""
    all_photos = session.exec(
        select(DrivePhoto).where(DrivePhoto.created_time.is_not(None))
    ).all()
    return [
        p for p in all_photos
        if p.created_time
        and p.created_time.month == month
        and p.created_time.day == day
    ]


def count_all(session: Session) -> int:
    return len(session.exec(select(DrivePhoto)).all())
