"""
Album service: DB-first reads.

Google Drive sync is handled by sync_service (on startup + manual trigger).
This service only reads from the DB and does a targeted shallow sync when
a user opens a specific album detail page (to keep photo lists fresh).
"""
from __future__ import annotations

from sqlmodel import Session

from models.album import DriveAlbum
from models.photo import DrivePhoto
from repositories import album_repo, photo_repo
from schemas.album import AlbumSummary, AlbumDetail, AlbumsListResponse
from schemas.photo import PhotoResponse
from services.media_response_service import media_response_fields, thumbnail_url_for
from services.sync_service import sync_folder_shallow
from core.exceptions import ReauthRequired, DriveError


def _to_photo_response(
    session: Session,
    p: DrivePhoto,
    fav_ids: set[str],
    workspace_id: int | None = None,
) -> PhotoResponse:
    media_fields = media_response_fields(
        session,
        drive_file_id=p.id,
        mime_type=p.mime_type,
        workspace_id=workspace_id,
    )
    return PhotoResponse(
        id=p.id,
        name=p.name,
        mime_type=p.mime_type,
        created_time=p.created_time,
        is_favorite=p.id in fav_ids,
        width=p.width,
        height=p.height,
        **media_fields,
    )


def _to_album_summary(
    session: Session,
    album: DriveAlbum,
    workspace_id: int | None = None,
) -> AlbumSummary:
    return AlbumSummary(
        id=album.id,
        name=album.name,
        cover_photo_id=album.cover_photo_id,
        photo_count=album.photo_count,
        child_count=album.child_count,
        thumbnail_url=(
            thumbnail_url_for(session, album.cover_photo_id, workspace_id) if album.cover_photo_id else None
        ),
        has_custom_cover=album.cover_photo_id is not None,
        description=album.description,
        location=album.location,
        start_date=album.start_date,
        end_date=album.end_date,
    )


def _resolve_cover(
    session: Session,
    album_id: str,
    workspace_id: int | None = None,
    depth: int = 0,
) -> str | None:
    """Find a cover photo ID for an album, recursing into subfolders (max depth 3)."""
    if depth > 3:
        return None
    photos = photo_repo.get_by_folder(session, album_id, workspace_id)
    if photos:
        return photos[0].id
    children = album_repo.get_by_parent(session, album_id, workspace_id)
    for child in children:
        cover = _resolve_cover(session, child.id, workspace_id, depth + 1)
        if cover:
            return cover
    return None


def _to_album_summary_with_resolved_cover(
    session: Session,
    album: DriveAlbum,
    workspace_id: int | None = None,
) -> AlbumSummary:
    """
    Like `_to_album_summary`, but falls back to a deterministic auto-picked
    cover (recursing into subfolders) when no manual `cover_photo_id` is
    set, rather than leaving `thumbnail_url` null. Used everywhere an
    album/folder is rendered as a card or header — see PR 7's "deterministic
    fallback ... never randomly change on reload" requirement. The fallback
    itself is deterministic because `_resolve_cover` always picks the same
    first photo (`photo_repo.get_by_folder` orders by `created_time desc`).
    """
    cover_id = album.cover_photo_id or _resolve_cover(session, album.id, workspace_id)
    return AlbumSummary(
        id=album.id,
        name=album.name,
        cover_photo_id=cover_id,
        photo_count=album.photo_count,
        child_count=album.child_count,
        thumbnail_url=thumbnail_url_for(session, cover_id, workspace_id) if cover_id else None,
        # Reported against the album's *stored* field, not the resolved id —
        # `cover_id` may be an auto-resolved fallback, which is not something
        # the user can meaningfully "reset".
        has_custom_cover=album.cover_photo_id is not None,
        description=album.description,
        location=album.location,
        start_date=album.start_date,
        end_date=album.end_date,
    )


def get_root_albums(session: Session, workspace_id: int | None = None) -> AlbumsListResponse:
    """Return root-level albums from DB (excluded folders filtered out)."""
    albums = album_repo.get_root_albums(session, workspace_id)
    summaries = [_to_album_summary(session, a, workspace_id) for a in albums]
    return AlbumsListResponse(albums=summaries, total=len(summaries))


def get_root_buckets(session: Session, workspace_id: int | None = None) -> AlbumsListResponse:
    """
    Return root-level Drive folders as buckets — the source of truth for
    top-level navigation. Uses recursive cover resolution so each bucket
    gets its own distinct thumbnail instead of all sharing the same one.
    """
    albums = album_repo.get_root_albums(session, workspace_id)
    summaries = [_to_album_summary_with_resolved_cover(session, a, workspace_id) for a in albums]
    return AlbumsListResponse(albums=summaries, total=len(summaries))


_STRUCTURAL_FOLDERS = {"photos", "videos"}


def _is_structural(album: DriveAlbum) -> bool:
    """True for Drive folders that are internal structure (Photos, Videos) — not real albums."""
    return album.name.lower() in _STRUCTURAL_FOLDERS


def _flatten_subfolders(
    session: Session,
    parent_id: str,
    workspace_id: int | None = None,
) -> list[DriveAlbum]:
    """
    Return the real sub-albums for a parent, skipping structural Photos/Videos
    folders and surfacing their children instead.
    e.g. Arjun → [Photos, Videos] → flattened to children of Photos + children of Videos
    """
    direct = album_repo.get_by_parent(session, parent_id, workspace_id)
    result: list[DriveAlbum] = []
    for a in direct:
        if _is_structural(a):
            # Flatten: include this structural folder's children instead
            result.extend(album_repo.get_by_parent(session, a.id, workspace_id))
        else:
            result.append(a)
    return result


def get_album_detail(
    session: Session,
    album_id: str,
    fav_ids: set[str],
    workspace_id: int | None = None,
) -> AlbumDetail:
    """
    Return album detail from DB.
    Triggers a shallow sync of just this folder to keep photos fresh.
    Falls back gracefully to stale cache if Drive is unreachable.

    Structural sub-folders named "Photos" or "Videos" are NOT shown in the UI;
    their children are merged directly into the subfolders list.
    """
    # Shallow sync this specific album on open (bounded cost — one folder)
    try:
        sync_folder_shallow(session, album_id, workspace_id=workspace_id)
    except (ReauthRequired, DriveError):
        pass  # serve stale cache

    album = album_repo.get_by_id(session, album_id, workspace_id)
    photos = photo_repo.get_by_folder(session, album_id, workspace_id)
    subfolders_flat = _flatten_subfolders(session, album_id, workspace_id)

    # Use the resolved-cover variant here too (not just for subfolders/
    # buckets, below) — PR 7 fix: previously the album's own header cover
    # only ever showed a *manually* selected cover_photo_id and stayed null
    # otherwise, even though every other card for the same album (its entry
    # in the parent's FolderGrid, the root bucket grid) already fell back to
    # a deterministic auto-picked cover. That meant an album with no manual
    # cover set showed a cover-less header while its own folder card
    # elsewhere on the site showed a real photo — inconsistent, and not the
    # "never randomly change on reload" deterministic fallback PR 7 requires.
    album_summary = _to_album_summary_with_resolved_cover(session, album, workspace_id) if album else AlbumSummary(
        # `child_count` is a required field on AlbumSummary — omitting it here
        # raised a ValidationError on the (rare) unknown-album path.
        id=album_id, name="Album", cover_photo_id=None, photo_count=None,
        child_count=None, thumbnail_url=None,
    )

    return AlbumDetail(
        album=album_summary,
        photos=[_to_photo_response(session, p, fav_ids, workspace_id) for p in photos],
        subfolders=[
            _to_album_summary_with_resolved_cover(session, a, workspace_id)
            for a in subfolders_flat
        ],
    )


class AlbumNotFoundError(Exception):
    pass


class PhotoNotFoundError(Exception):
    pass


class PhotoNotInAlbumError(Exception):
    """The requested cover photo is not part of this album's folder tree."""


# Bounded a little deeper than `_resolve_cover`'s depth 3 so a legitimate
# selection is never rejected by the walk running out of depth first.
_COVER_TREE_MAX_DEPTH = 5


def _photo_in_album_tree(
    session: Session,
    album_id: str,
    photo: DrivePhoto,
    workspace_id: int | None = None,
) -> bool:
    """
    True when `photo` lives in `album_id` itself or in one of its visible
    descendant folders.

    Every selection the UI can actually produce is a *direct* child of the
    album being edited (both cover-selection surfaces are built from
    `AlbumDetail.photos`, which is `photo_repo.get_by_folder(album_id)`), so
    this check cannot produce a false negative for a real user action; the
    descendant walk exists only to stay permissive for future surfaces that
    offer a folder's nested photos.
    """
    parent = photo.parent_folder_id
    if not parent:
        return False
    if parent == album_id:
        return True
    seen: set[str] = {album_id}
    frontier = [album_id]
    for _ in range(_COVER_TREE_MAX_DEPTH):
        next_frontier: list[str] = []
        for folder_id in frontier:
            for child in album_repo.get_by_parent(session, folder_id, workspace_id):
                if child.id in seen:
                    continue
                if child.id == parent:
                    return True
                seen.add(child.id)
                next_frontier.append(child.id)
        if not next_frontier:
            return False
        frontier = next_frontier
    return False


def set_album_cover(
    session: Session,
    album_id: str,
    photo_id: str | None,
    workspace_id: int | None = None,
) -> AlbumSummary:
    """
    Set (or, when `photo_id` is None, clear/reset to the deterministic
    automatic fallback) an album's manually-selected cover photo.

    Idempotent: calling this twice with the same `photo_id` is a no-op
    from the caller's point of view (same resulting state, no error) —
    `album_repo.set_cover_photo` simply re-saves the same value.

    Stores only the photo id reference (`DriveAlbum.cover_photo_id`) — never
    duplicates image bytes; the returned `thumbnail_url` is served from the
    existing cached derivative for that photo (no new derivative work is
    triggered by selecting a cover).
    """
    album = album_repo.get_by_id(session, album_id, workspace_id)
    if not album:
        raise AlbumNotFoundError(album_id)
    if photo_id is not None:
        photo = photo_repo.get_by_id(session, photo_id, workspace_id)
        if not photo:
            raise PhotoNotFoundError(photo_id)
        # Containment check (added in PR 7 review). Without it, any
        # authenticated caller could point an album's cover at *any* photo id
        # in the library — including one inside a folder deliberately marked
        # `excluded` (hidden from every view), which would resurface hidden
        # media as a cover tile. The legacy `albums`/`photos` tables carry no
        # `workspace_id` (verified: `backend/models/album.py`,
        # `backend/models/photo.py`), so this is a single shared library and
        # there is no cross-workspace dimension to this endpoint — but "any
        # photo in the database" is still wider than the feature needs.
        if not _photo_in_album_tree(session, album_id, photo, workspace_id):
            raise PhotoNotInAlbumError(photo_id)
    updated = album_repo.set_cover_photo(session, album_id, photo_id, workspace_id)
    return _to_album_summary_with_resolved_cover(session, updated, workspace_id)


def update_album_metadata(
    session: Session,
    album_id: str,
    workspace_id: int | None = None,
    *,
    description: str | None = ...,
    location: str | None = ...,
    start_date=...,
    end_date=...,
) -> AlbumSummary:
    """
    Partial update of the optional description/location/start_date/end_date
    fields (PR 7). No frontend edit UI exists yet — this endpoint exists so
    the fields can actually be populated (e.g. via a future admin UI or a
    one-off script) without a second write path being invented later; see
    `docs/redesign-v2/STATE.md` for the scope decision.
    """
    album = album_repo.get_by_id(session, album_id, workspace_id)
    if not album:
        raise AlbumNotFoundError(album_id)
    updated = album_repo.update_metadata(
        session,
        album_id,
        workspace_id,
        description=description,
        location=location,
        start_date=start_date,
        end_date=end_date,
    )
    return _to_album_summary_with_resolved_cover(session, updated, workspace_id)
