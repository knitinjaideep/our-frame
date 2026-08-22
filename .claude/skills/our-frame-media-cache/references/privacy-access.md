# Privacy and Access

Our Frame contains private family media.

## Default Access Model

- Users sign in with Google.
- Users belong to workspaces.
- Workspaces own Drive connections and media.
- Media APIs enforce workspace ownership or membership.

## Private Media

Private media should be served by authenticated app routes or carefully scoped signed URLs.

Do not introduce public object-storage URLs unless the task explicitly defines sharing behavior.

## Secrets

Never commit or log:

- `.env`
- OAuth tokens
- refresh tokens
- session tokens
- object-storage credentials
- generated private media files

## Family Use

The target production model is invite-only family access:

- owner
- viewer/editor family members

Do not assume public portfolio behavior unless asked.

## Deployment Direction

Good hosted direction:

- Vercel frontend
- Render/Fly.io backend
- Supabase Postgres
- Cloudflare R2 or Supabase Storage

Good private direction:

- home server or Mac mini
- Tailscale
- local disk storage
- SQLite or Postgres

Do not implement deployment infrastructure as part of media-cache tasks unless the work item explicitly asks for it.
