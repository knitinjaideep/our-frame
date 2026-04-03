from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DrivePhoto(SQLModel, table=True):
    __tablename__ = "photos"

    id: str = Field(primary_key=True)           # Google Drive file ID
    name: str
    mime_type: str
    parent_folder_id: Optional[str] = Field(default=None, index=True)
    created_time: Optional[datetime] = Field(default=None, index=True)
    modified_time: Optional[datetime] = None
    size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    web_view_link: Optional[str] = None
    cached_at: datetime = Field(default_factory=datetime.utcnow)
