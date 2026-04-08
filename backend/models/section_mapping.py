"""
SectionMapping: explicit Drive folder → section key assignments.

Stored in DB so the mapping is configurable without code changes.
A folder mapped here takes precedence over keyword-based auto-categorization.

section_key values used by the app:
  "child"       — Arjun / growing up
  "travel"      — travel & adventures
  "milestones"  — life events (wedding, engagement, birthdays)
  "life"        — everything else (friends, family, photography)
"""
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class SectionMapping(SQLModel, table=True):
    __tablename__ = "section_mappings"

    id: Optional[int] = Field(default=None, primary_key=True)
    folder_id: str = Field(unique=True, index=True)   # Google Drive folder ID
    section_key: str = Field(index=True)               # e.g. "child", "travel", "photography"
    label: Optional[str] = None                        # human-readable override label
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
