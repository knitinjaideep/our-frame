from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class DriveAlbum(SQLModel, table=True):
    __tablename__ = "albums"

    id: str = Field(primary_key=True)           # Google Drive folder ID
    workspace_id: Optional[int] = Field(default=None, foreign_key="workspaces.id", index=True)
    name: str
    parent_id: Optional[str] = Field(default=None, index=True)
    cover_photo_id: Optional[str] = None
    photo_count: Optional[int] = None
    child_count: Optional[int] = None           # Number of sub-folders
    drive_modified_time: Optional[datetime] = None  # modifiedTime from Drive
    last_synced: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Enrichment fields
    excluded: bool = Field(default=False, index=True)    # Hidden from all views
    section: Optional[str] = Field(default=None, index=True)  # mapped section key

    # PR 7 (redesign-v2) metadata fields — all optional/additive, backward
    # compatible with existing rows. `cover_photo_id` above already served
    # as the manual-cover reference field (present since before this PR but
    # never written to by any endpoint); these four are new columns added
    # via the SQLite migration in `main.py`'s `_run_schema_migrations()`.
    description: Optional[str] = Field(default=None)
    location: Optional[str] = Field(default=None)
    start_date: Optional[datetime] = Field(default=None)
    end_date: Optional[datetime] = Field(default=None)
