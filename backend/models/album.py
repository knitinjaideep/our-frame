from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DriveAlbum(SQLModel, table=True):
    __tablename__ = "albums"

    id: str = Field(primary_key=True)           # Google Drive folder ID
    name: str
    parent_id: Optional[str] = Field(default=None, index=True)
    cover_photo_id: Optional[str] = None
    photo_count: Optional[int] = None
    last_synced: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
