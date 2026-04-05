"""
Settings endpoints: manage section mappings and folder exclusions.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from api.deps import get_db
from repositories import album_repo
from services.sections_service import (
    get_all_mappings,
    upsert_mapping,
    delete_mapping,
)
from models.section_mapping import SectionMapping

router = APIRouter(prefix="/settings", tags=["Settings"])


# ── Section mappings ──────────────────────────────────────────────────────────

class SectionMappingIn(BaseModel):
    folder_id: str
    section_key: str          # "child" | "travel" | "photography"
    label: Optional[str] = None


class SectionMappingOut(BaseModel):
    id: Optional[int]
    folder_id: str
    section_key: str
    label: Optional[str]


@router.get("/sections", response_model=list[SectionMappingOut])
def list_section_mappings(session: Session = Depends(get_db)):
    """Return all explicit folder → section mappings."""
    return [
        SectionMappingOut(
            id=m.id,
            folder_id=m.folder_id,
            section_key=m.section_key,
            label=m.label,
        )
        for m in get_all_mappings(session)
    ]


@router.post("/sections", response_model=SectionMappingOut)
def set_section_mapping(body: SectionMappingIn, session: Session = Depends(get_db)):
    """Create or update a folder → section mapping."""
    valid_keys = {"child", "travel", "photography"}
    if body.section_key not in valid_keys:
        raise HTTPException(
            status_code=422,
            detail=f"section_key must be one of: {', '.join(sorted(valid_keys))}",
        )
    mapping = upsert_mapping(session, body.folder_id, body.section_key, body.label)
    return SectionMappingOut(
        id=mapping.id,
        folder_id=mapping.folder_id,
        section_key=mapping.section_key,
        label=mapping.label,
    )


@router.delete("/sections/{folder_id}")
def remove_section_mapping(folder_id: str, session: Session = Depends(get_db)):
    """Remove an explicit section mapping for a folder."""
    removed = delete_mapping(session, folder_id)
    if not removed:
        raise HTTPException(status_code=404, detail="No mapping found for this folder")
    return {"removed": folder_id}
