"""Workspace business logic."""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from models.workspace import Workspace, WorkspaceMember
from models.drive_connection import DriveConnection


def slugify(text: str) -> str:
    """Convert a display name to a URL-safe slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = slug.strip("-")
    return slug[:100]


def is_slug_available(db: Session, slug: str, exclude_id: Optional[int] = None) -> bool:
    stmt = select(Workspace).where(Workspace.slug == slug)
    existing = db.exec(stmt).first()
    if not existing:
        return True
    if exclude_id is not None and existing.id == exclude_id:
        return True
    return False


def create_workspace(
    db: Session,
    owner_user_id: int,
    name: str,
    slug: str,
    subtitle: Optional[str] = None,
    layout_preset: str = "editorial",
    theme_preset: str = "warm_dark",
    privacy_mode: str = "private",
    folder_template: str = "family",
) -> Workspace:
    if not is_slug_available(db, slug):
        raise ValueError(f"Slug '{slug}' is already taken")

    workspace = Workspace(
        owner_user_id=owner_user_id,
        name=name,
        slug=slug,
        subtitle=subtitle,
        layout_preset=layout_preset,
        theme_preset=theme_preset,
        privacy_mode=privacy_mode,
        folder_template=folder_template,
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # Owner is also a workspace member with role "owner"
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=owner_user_id,
        role="owner",
    )
    db.add(member)
    db.commit()

    return workspace


def get_workspace_by_id(db: Session, workspace_id: int) -> Optional[Workspace]:
    return db.get(Workspace, workspace_id)


def list_user_workspaces(db: Session, user_id: int) -> list[Workspace]:
    """All workspaces the user owns or is a member of."""
    # Owned
    owned = db.exec(select(Workspace).where(Workspace.owner_user_id == user_id)).all()
    owned_ids = {w.id for w in owned}

    # Member of
    memberships = db.exec(
        select(WorkspaceMember).where(WorkspaceMember.user_id == user_id)
    ).all()
    member_workspace_ids = [m.workspace_id for m in memberships if m.workspace_id not in owned_ids]

    additional = []
    if member_workspace_ids:
        additional = db.exec(
            select(Workspace).where(Workspace.id.in_(member_workspace_ids))
        ).all()

    return list(owned) + list(additional)


def update_workspace(
    db: Session,
    workspace: Workspace,
    *,
    name: Optional[str] = None,
    slug: Optional[str] = None,
    subtitle: Optional[str] = None,
    layout_preset: Optional[str] = None,
    theme_preset: Optional[str] = None,
    privacy_mode: Optional[str] = None,
    folder_template: Optional[str] = None,
    onboarding_complete: Optional[bool] = None,
    drive_connect_deferred: Optional[bool] = None,
) -> Workspace:
    if name is not None:
        workspace.name = name
    if slug is not None:
        if not is_slug_available(db, slug, exclude_id=workspace.id):
            raise ValueError(f"Slug '{slug}' is already taken")
        workspace.slug = slug
    if subtitle is not None:
        workspace.subtitle = subtitle
    if layout_preset is not None:
        workspace.layout_preset = layout_preset
    if theme_preset is not None:
        workspace.theme_preset = theme_preset
    if privacy_mode is not None:
        workspace.privacy_mode = privacy_mode
    if folder_template is not None:
        workspace.folder_template = folder_template
    if onboarding_complete is not None:
        workspace.onboarding_complete = onboarding_complete
    if drive_connect_deferred is not None:
        workspace.drive_connect_deferred = drive_connect_deferred

    workspace.updated_at = datetime.now(timezone.utc)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


def delete_workspace(db: Session, workspace: Workspace) -> None:
    """
    Delete a workspace and all its dependent rows.
    Order matters for FK constraints: children before parent.
    """
    from models.drive_connection import DriveConnection
    from models.audit_log import AuditLog

    workspace_id = workspace.id

    # Drive connection
    drive_conn = db.exec(
        select(DriveConnection).where(DriveConnection.workspace_id == workspace_id)
    ).first()
    if drive_conn:
        db.delete(drive_conn)

    # Audit logs
    from sqlmodel import select as _sel
    audit_rows = db.exec(
        _sel(AuditLog).where(AuditLog.workspace_id == workspace_id)
    ).all()
    for row in audit_rows:
        db.delete(row)

    # Members
    members = db.exec(
        select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
    ).all()
    for m in members:
        db.delete(m)

    # Workspace itself
    db.delete(workspace)
    db.commit()


def get_drive_connection(db: Session, workspace_id: int) -> Optional[DriveConnection]:
    return db.exec(
        select(DriveConnection).where(DriveConnection.workspace_id == workspace_id)
    ).first()
