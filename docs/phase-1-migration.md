# Phase 1 — Platform Foundation Migration Notes

## What Changed

This phase converts Our Frame from a single-user, single-Drive family app into a clean platform foundation for multi-user, workspace-based access with per-user Google Drive connections.

---

## New Backend Models

Five new SQLModel tables are added to the database. They are created automatically on first startup via `create_db_and_tables()`.

| Table | Purpose |
|---|---|
| `users` | Platform user accounts (one per Google identity) |
| `user_sessions` | Server-side sessions (HttpOnly cookie auth) |
| `workspaces` | Workspace per user — name, slug, layout, privacy settings |
| `workspace_members` | Membership table (owner/editor/viewer roles) |
| `drive_connections` | Per-workspace Google Drive OAuth tokens |
| `audit_logs` | Platform event trail for admin visibility |

The existing tables (`albums`, `photos`, `favorites`, `section_mappings`, `ai_results`) are **untouched**.

---

## New Environment Variables

Add these to `backend/.env` (see `backend/.env.example`):

```env
# Per-user Drive OAuth callback (add to Google Cloud Console authorized redirect URIs)
GOOGLE_DRIVE_OAUTH_REDIRECT=http://localhost:8000/api/drive/callback

# Session secret — generate with: python -c "import secrets; print(secrets.token_hex(32))"
SESSION_SECRET=change-me-in-production

# Token encryption for Drive credentials stored in DB
# Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# If empty: tokens stored base64-only (local dev only — NOT safe for production)
TOKEN_ENCRYPTION_KEY=
```

### Google Cloud Console changes needed

Add a second authorized redirect URI:
- `http://localhost:8000/api/drive/callback` (development)
- `https://yourdomain.com/api/drive/callback` (production)

---

## New Backend Routes

### Auth (`/api/auth/...`)
| Route | Description |
|---|---|
| `GET /api/auth/google/start` | Start Google login |
| `GET /api/auth/google/callback` | Handle OAuth callback, set session cookie |
| `GET /api/auth/me` | Current user or 401 |
| `POST /api/auth/logout` | Clear session |

### Workspaces (`/api/workspaces/...`)
| Route | Description |
|---|---|
| `POST /api/workspaces` | Create workspace |
| `GET /api/workspaces` | List user's workspaces |
| `GET /api/workspaces/{id}` | Get workspace |
| `PATCH /api/workspaces/{id}` | Update workspace (owner only) |
| `GET /api/workspaces/{id}/status` | Onboarding + drive status |

### Drive Connection (`/api/drive/...`)
| Route | Description |
|---|---|
| `GET /api/drive/connect/{workspace_id}` | Start Drive OAuth for workspace |
| `GET /api/drive/callback` | Handle Drive OAuth callback |
| `GET /api/drive/{workspace_id}/status` | Connection status |
| `POST /api/drive/{workspace_id}/root-folder` | Set root folder ID |
| `GET /api/drive/{workspace_id}/folders` | List top-level folders |

### Admin (`/api/admin/...`) — platform admin only
| Route | Description |
|---|---|
| `GET /api/admin/users` | Safe user list |
| `GET /api/admin/workspaces` | Safe workspace list |
| `GET /api/admin/stats` | Platform stats |

### Legacy routes preserved
- `GET/POST /auth/...` — legacy single-user OAuth (still functional during migration)
- `GET /drive/file/...` — image serving (unchanged)

---

## New Frontend Routes

| Route | Description |
|---|---|
| `/login` | Entry page — Google sign-in CTA |
| `/onboarding` | Multi-step workspace setup flow |
| `/settings` | Workspace settings + Drive status |
| `/admin` | Platform admin dashboard (admin users only) |

---

## New Frontend Components

```
components/
  auth/
    login-view.tsx      — Premium login page
    auth-gate.tsx       — Post-login routing guard
  onboarding/
    onboarding-flow.tsx — Multi-step onboarding coordinator
    steps/
      step-welcome.tsx
      step-name.tsx
      step-layout.tsx
      step-privacy.tsx
      step-drive-connect.tsx
      step-finish.tsx
  settings/
    settings-view.tsx   — Workspace settings + drive connection
  admin/
    admin-view.tsx      — Admin scaffold

hooks/
  use-auth.ts           — useCurrentUser, useWorkspaces, useLogout

lib/
  platform-api.ts       — Phase 1 API client helpers

types/
  platform.ts           — CurrentUser, Workspace, WorkspaceStatus, DriveConnectionStatus
```

---

## Auth Architecture

**Cookie**: `of_session` — HttpOnly, SameSite=Lax, not Secure in local dev (enable Secure in production with HTTPS).

**Session lifecycle**:
1. User hits `GET /api/auth/google/start`
2. Google redirects back to `GET /api/auth/google/callback`
3. Backend upserts `User`, creates `UserSession`, sets `of_session` cookie
4. Frontend AuthGate reads session via `GET /api/auth/me` on every load
5. `POST /api/auth/logout` deletes session and clears cookie

**Drive connect** is a separate OAuth flow per workspace:
1. `GET /api/drive/connect/{workspace_id}` → Google Drive consent screen
2. Google redirects to `GET /api/drive/callback`
3. Backend stores encrypted tokens in `drive_connections` table
4. Frontend polling (`getDriveStatus`) detects `status === 'active'` and advances

---

## Security Notes

### What's secure now
- Per-user sessions (no shared token file)
- HttpOnly cookie session (JS cannot read)
- Tenant isolation: every `/api/workspaces/{id}/*` route validates ownership
- Admin endpoints require `is_platform_admin = true`
- No media data exposed from admin endpoints
- Drive tokens encrypted with Fernet if `TOKEN_ENCRYPTION_KEY` is set

### What needs hardening for production
- Set `TOKEN_ENCRYPTION_KEY` — do not run prod without it
- Enable `Secure` cookie flag (requires HTTPS)
- Move to Postgres (`DATABASE_URL=postgresql+psycopg2://...`)
- Consider KMS-backed token storage (AWS Secrets Manager / GCP Secret Manager)
- Add rate limiting to auth endpoints
- Set `SESSION_SECRET` to a strong random value

### Making yourself a platform admin (one-time)
```bash
# Open a Python shell in the backend directory
python3 -c "
from core.database import engine
from sqlmodel import Session, select
from models.user import User

with Session(engine) as db:
    user = db.exec(select(User).where(User.email == 'you@example.com')).first()
    user.is_platform_admin = True
    db.add(user)
    db.commit()
    print('Done')
"
```

---

## Installation

```bash
# Install the new cryptography dependency
cd backend && pip install -r requirements.txt

# The new tables are created automatically on next startup
npm run dev
```

---

## Backward Compatibility

The legacy single-user flow is fully preserved:
- `GET /auth/start` still works
- `GET /auth/callback` still saves `token.json`
- `GET /auth/status` still checks for `token.json`
- All existing album/home/favorites/sync/sections endpoints are unchanged
- The startup sync (`maybe_sync_on_startup`) still runs

The new multi-user system runs in parallel. As you migrate each feature to use workspace-aware Drive connections, you can gradually remove the legacy paths.

---

## Phase 2 Roadmap (not in scope yet)

- Workspace-scoped album/photo sync (each workspace uses its own DriveConnection)
- Invite-based workspace membership UI
- Public portfolio pages
- Semantic photo search (vector embeddings)
- AI captions and story generation
- CDN strategy for thumbnails
