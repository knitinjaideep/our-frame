from datetime import datetime
from sqlmodel import Session, select
from models.photo import DrivePhoto


def upsert(session: Session, photo: DrivePhoto, *, commit: bool = True) -> DrivePhoto:
    existing = session.get(DrivePhoto, photo.id)
    if existing:
        if existing.workspace_id is None:
            existing.workspace_id = photo.workspace_id
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
        if commit:
            session.commit()
            session.refresh(existing)
        else:
            session.flush()
        return existing
    session.add(photo)
    if commit:
        session.commit()
        session.refresh(photo)
    else:
        session.flush()
    return photo


def get_by_folder(
    session: Session,
    folder_id: str,
    workspace_id: int | None = None,
) -> list[DrivePhoto]:
    stmt = (
        select(DrivePhoto)
        .where(DrivePhoto.parent_folder_id == folder_id)
        .order_by(DrivePhoto.created_time.desc())
    )
    if workspace_id is not None:
        stmt = stmt.where(DrivePhoto.workspace_id == workspace_id)
    return list(
        session.exec(stmt).all()
    )


def get_by_id(
    session: Session,
    photo_id: str,
    workspace_id: int | None = None,
) -> DrivePhoto | None:
    photo = session.get(DrivePhoto, photo_id)
    if not photo:
        return None
    if workspace_id is not None and photo.workspace_id != workspace_id:
        return None
    return photo


def get_by_month_day(
    session: Session,
    month: int,
    day: int,
    workspace_id: int | None = None,
) -> list[DrivePhoto]:
    """Return photos taken on the same calendar month+day across all years."""
    stmt = select(DrivePhoto).where(DrivePhoto.created_time.is_not(None))
    if workspace_id is not None:
        stmt = stmt.where(DrivePhoto.workspace_id == workspace_id)
    all_photos = session.exec(stmt).all()
    return [
        p for p in all_photos
        if p.created_time
        and p.created_time.month == month
        and p.created_time.day == day
    ]


def get_by_month(
    session: Session,
    month: int,
    workspace_id: int | None = None,
) -> list[DrivePhoto]:
    """Return photos taken anywhere in the given calendar month, any year."""
    stmt = select(DrivePhoto).where(DrivePhoto.created_time.is_not(None))
    if workspace_id is not None:
        stmt = stmt.where(DrivePhoto.workspace_id == workspace_id)
    all_photos = session.exec(stmt).all()
    return [
        p for p in all_photos
        if p.created_time and p.created_time.month == month
    ]


def count_all(session: Session, workspace_id: int | None = None) -> int:
    stmt = select(DrivePhoto)
    if workspace_id is not None:
        stmt = stmt.where(DrivePhoto.workspace_id == workspace_id)
    return len(session.exec(stmt).all())
