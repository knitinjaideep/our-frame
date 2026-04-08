"""
Sections service: categorises albums into editorial worlds.

Precedence (highest → lowest):
  1. Explicit SectionMapping row in DB  (configurable via /settings/sections)
  2. album.section field stamped during sync
  3. Keyword-based auto-categorisation (regex fallback)

This means:
  - Admins can hard-wire a specific Drive folder to a section via the API.
  - Sync service stamps section on folders that match mappings.
  - Unmatched folders can still be auto-categorised by keyword.

Cover images are resolved recursively for deep folder structures.
"""
from __future__ import annotations

import re
from sqlmodel import Session, select

from repositories import album_repo, photo_repo
from schemas.album import AlbumSummary
from schemas.sections import SectionsResponse
from models.album import DriveAlbum
from models.section_mapping import SectionMapping


# ── Keyword fallback rules ────────────────────────────────────────────────────
_ARJUN_RE = re.compile(
    r"\b(arjun|baby|infant|toddler|kid|kids|son|little|first|newborn|month)\b",
    re.IGNORECASE,
)

_TRAVEL_RE = re.compile(
    r"\b(travel|trip|vacation|holiday|tour|journey|visit|adventure|"
    r"india|usa|europe|japan|thailand|bali|mexico|beach|mountain|"
    r"dubai|paris|london|new york|tokyo|singapore|hawaii|abroad|weekend)\b",
    re.IGNORECASE,
)

_MILESTONES_RE = re.compile(
    r"\b(milestone|engagement|wedding|shower|birthday|anniversary|graduation|"
    r"birth|pregnancy|proposal|ceremony|celebration|debut|first day)\b",
    re.IGNORECASE,
)

_LIFE_RE = re.compile(
    r"\b(life|friends?|family|sister|brother|mom|dad|parents?|random|"
    r"everyday|moments?|people|portrait|home|holiday|christmas|diwali|"
    r"photography|street|landscape|nature|studio)\b",
    re.IGNORECASE,
)

_KEYWORD_MAP: dict[str, re.Pattern] = {
    "child": _ARJUN_RE,
    "travel": _TRAVEL_RE,
    "milestones": _MILESTONES_RE,
    "life": _LIFE_RE,
}


def _photo_url(photo_id: str, size: int = 600) -> str:
    return f"/drive/file/{photo_id}/thumbnail?s={size}"


def _resolve_cover(session: Session, album_id: str, depth: int = 0) -> str | None:
    """Recursively find a cover photo ID for an album (max depth 3)."""
    if depth > 3:
        return None
    photos = photo_repo.get_by_folder(session, album_id)
    if photos:
        return photos[0].id
    children = album_repo.get_by_parent(session, album_id)
    for child in children:
        cover = _resolve_cover(session, child.id, depth + 1)
        if cover:
            return cover
    return None


def _to_summary(session: Session, album: DriveAlbum) -> AlbumSummary:
    cover_id = album.cover_photo_id or _resolve_cover(session, album.id)
    return AlbumSummary(
        id=album.id,
        name=album.name,
        cover_photo_id=cover_id,
        photo_count=album.photo_count,
        child_count=album.child_count,
        thumbnail_url=_photo_url(cover_id) if cover_id else None,
    )


def _get_explicit_mappings(session: Session) -> dict[str, str]:
    """Returns {folder_id: section_key} for all explicit DB mappings."""
    rows = session.exec(select(SectionMapping)).all()
    return {row.folder_id: row.section_key for row in rows}


def _classify_album(
    album: DriveAlbum,
    explicit: dict[str, str],
) -> str | None:
    """
    Return section key for this album, or None if it doesn't fit any section.

    Priority:
      1. album.section (stamped from explicit mapping during sync)
      2. explicit mapping dict (same source, belt-and-suspenders)
      3. keyword match on album name
    """
    # 1. DB-stamped section
    if album.section:
        return album.section

    # 2. Explicit mapping lookup
    if album.id in explicit:
        return explicit[album.id]

    # 3. Keyword fallback
    for key, pattern in _KEYWORD_MAP.items():
        if pattern.search(album.name):
            return key

    return None


def _get_root_section(session: Session, album: DriveAlbum, explicit: dict[str, str]) -> str | None:
    """
    Walk up to the root parent and classify by its name.
    This supports nested structures like: root → Arjun → First Year → photos
    where 'First Year' should inherit the 'child' section from 'Arjun'.
    """
    # First try classifying this album directly
    key = _classify_album(album, explicit)
    if key:
        return key

    # Walk up to find the root parent and classify by it
    current = album
    while current.parent_id is not None:
        parent = album_repo.get_by_id(session, current.parent_id)
        if parent is None:
            break
        key = _classify_album(parent, explicit)
        if key:
            return key
        current = parent

    return None


def get_sections(session: Session) -> SectionsResponse:
    from sqlmodel import select as sql_select
    all_albums = list(session.exec(
        sql_select(DriveAlbum).where(DriveAlbum.excluded == False)  # noqa: E712
    ).all())
    explicit = _get_explicit_mappings(session)

    result: dict[str, list[AlbumSummary]] = {
        "child": [],
        "travel": [],
        "milestones": [],
        "life": [],
    }

    # Root-level container folders — skip these, surface their children instead
    root_ids = {a.id for a in all_albums if a.parent_id is None}

    for album in all_albums:
        # Skip root containers — their sub-albums will be shown instead
        if album.id in root_ids:
            continue

        key = _get_root_section(session, album, explicit)
        if key and key in result:
            result[key].append(_to_summary(session, album))

    # Fallback: if no sub-albums found for a section, show root containers
    for section_key in ("child", "travel", "milestones", "life"):
        if not result[section_key]:
            for album in all_albums:
                if album.id in root_ids:
                    key = _classify_album(album, explicit)
                    if key == section_key:
                        result[section_key].append(_to_summary(session, album))

    return SectionsResponse(
        featured_child=result["child"],
        travel=result["travel"],
        milestones=result["milestones"],
        life=result["life"],
    )


# ── Section mapping management ────────────────────────────────────────────────

def get_all_mappings(session: Session) -> list[SectionMapping]:
    return list(session.exec(select(SectionMapping)).all())


def upsert_mapping(
    session: Session,
    folder_id: str,
    section_key: str,
    label: str | None = None,
) -> SectionMapping:
    existing = session.exec(
        select(SectionMapping).where(SectionMapping.folder_id == folder_id)
    ).first()

    from datetime import datetime, timezone
    now = datetime.now(tz=timezone.utc)

    if existing:
        existing.section_key = section_key
        existing.label = label
        existing.updated_at = now
        session.add(existing)
        session.commit()
        session.refresh(existing)
        # Stamp the album record too
        _stamp_album_section(session, folder_id, section_key)
        return existing

    mapping = SectionMapping(
        folder_id=folder_id,
        section_key=section_key,
        label=label,
    )
    session.add(mapping)
    session.commit()
    session.refresh(mapping)
    _stamp_album_section(session, folder_id, section_key)
    return mapping


def delete_mapping(session: Session, folder_id: str) -> bool:
    existing = session.exec(
        select(SectionMapping).where(SectionMapping.folder_id == folder_id)
    ).first()
    if not existing:
        return False
    session.delete(existing)
    session.commit()
    _stamp_album_section(session, folder_id, None)
    return True


def _stamp_album_section(
    session: Session,
    folder_id: str,
    section_key: str | None,
) -> None:
    """Keep album.section in sync when a mapping is added/removed."""
    from repositories import album_repo as ar
    album = ar.get_by_id(session, folder_id)
    if album:
        album.section = section_key
        session.add(album)
        session.commit()
