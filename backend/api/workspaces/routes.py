"""
Workspace CRUD routes.

POST   /api/workspaces              — create workspace (authenticated)
GET    /api/workspaces              — list user's workspaces
GET    /api/workspaces/{id}         — get workspace detail
PATCH  /api/workspaces/{id}         — update workspace (owner only)
DELETE /api/workspaces/{id}         — delete workspace + cascade (owner only)
GET    /api/workspaces/{id}/status  — onboarding / drive status summary
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlmodel import Session

from api.deps import get_current_user, get_db, require_workspace_owner
from models.user import User
from models.workspace import Workspace
from services.workspace_service import (
    create_workspace,
    delete_workspace,
    get_drive_connection,
    get_workspace_by_id,
    list_user_workspaces,
    slugify,
    update_workspace,
)

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])


# ── Schemas ───────────────────────────────────────────────────────────────────


class WorkspaceCreate(BaseModel):
    name: str
    slug: Optional[str] = None  # auto-generated if omitted
    subtitle: Optional[str] = None
    layout_preset: str = "editorial"
    theme_preset: str = "warm_dark"
    privacy_mode: str = "private"
    folder_template: str = "family"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("name must not be empty")
        return v.strip()

    @field_validator("slug", mode="before")
    @classmethod
    def slug_format(cls, v):
        if v is None:
            return v
        import re
        v = v.lower().strip()
        if not re.match(r"^[a-z0-9][a-z0-9\-]{0,98}[a-z0-9]?$", v):
            raise ValueError("Slug must be lowercase letters, numbers, and hyphens only")
        return v


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    subtitle: Optional[str] = None
    layout_preset: Optional[str] = None
    theme_preset: Optional[str] = None
    privacy_mode: Optional[str] = None
    folder_template: Optional[str] = None
    onboarding_complete: Optional[bool] = None
    drive_connect_deferred: Optional[bool] = None


class WorkspaceResponse(BaseModel):
    id: int
    owner_user_id: int
    name: str
    slug: str
    subtitle: Optional[str]
    layout_preset: str
    theme_preset: str
    privacy_mode: str
    folder_template: str
    onboarding_complete: bool
    drive_connect_deferred: bool
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, w: Workspace) -> "WorkspaceResponse":
        return cls(
            id=w.id,
            owner_user_id=w.owner_user_id,
            name=w.name,
            slug=w.slug,
            subtitle=w.subtitle,
            layout_preset=w.layout_preset,
            theme_preset=w.theme_preset,
            privacy_mode=w.privacy_mode,
            folder_template=w.folder_template,
            onboarding_complete=w.onboarding_complete,
            drive_connect_deferred=getattr(w, "drive_connect_deferred", False) or False,
            created_at=w.created_at.isoformat(),
            updated_at=w.updated_at.isoformat(),
        )


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("", response_model=WorkspaceResponse, status_code=201)
def create(
    body: WorkspaceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slug = body.slug or slugify(body.name)
    if not slug:
        raise HTTPException(400, "Could not generate a valid slug from name")

    try:
        workspace = create_workspace(
            db,
            owner_user_id=user.id,
            name=body.name,
            slug=slug,
            subtitle=body.subtitle,
            layout_preset=body.layout_preset,
            theme_preset=body.theme_preset,
            privacy_mode=body.privacy_mode,
            folder_template=body.folder_template,
        )
    except ValueError as exc:
        raise HTTPException(409, str(exc))

    return WorkspaceResponse.from_orm(workspace)


@router.get("", response_model=list[WorkspaceResponse])
def list_workspaces(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workspaces = list_user_workspaces(db, user.id)
    return [WorkspaceResponse.from_orm(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace: Workspace = Depends(require_workspace_owner),
):
    # require_workspace_owner already validates access
    return WorkspaceResponse.from_orm(workspace)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
def patch_workspace(
    body: WorkspaceUpdate,
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    try:
        updated = update_workspace(
            db,
            workspace,
            name=body.name,
            slug=body.slug,
            subtitle=body.subtitle,
            layout_preset=body.layout_preset,
            theme_preset=body.theme_preset,
            privacy_mode=body.privacy_mode,
            folder_template=body.folder_template,
            onboarding_complete=body.onboarding_complete,
            drive_connect_deferred=body.drive_connect_deferred,
        )
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    return WorkspaceResponse.from_orm(updated)


@router.delete("/{workspace_id}", status_code=204)
def delete(
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    """
    Permanently delete a workspace and all associated data:
    - DriveConnection (tokens revoked from our side)
    - WorkspaceMembers
    - AuditLogs
    The workspace owner is the only one who can do this.
    """
    delete_workspace(db, workspace)


@router.get("/{workspace_id}/status")
def workspace_status(
    workspace: Workspace = Depends(require_workspace_owner),
    db: Session = Depends(get_db),
):
    """Summary of onboarding + drive connection status for a workspace."""
    drive_conn = get_drive_connection(db, workspace.id)

    drive_status = "not_connected"
    has_root_folder = False
    if drive_conn:
        drive_status = drive_conn.connection_status
        has_root_folder = bool(drive_conn.root_folder_id)

    return {
        "workspace_id": workspace.id,
        "onboarding_complete": workspace.onboarding_complete,
        "drive_status": drive_status,
        "has_root_folder": has_root_folder,
    }
