# Our Frame Setup

This is the single setup guide for Our Frame. Use it for local development and
for production deployment to:

- Frontend: `https://ourframe.nitinkotcherlakota.com`
- Backend API: `https://api.ourframe.nitinkotcherlakota.com`
- Production database/storage: Supabase
- Hosting: Vercel
- Original media source: Google Drive

Keep local and production separate:

- Local backend uses `backend/.env.local`, local SQLite, and local Google OAuth
  redirect URLs.
- Local frontend uses `frontend/.env.local` and talks to
  `http://localhost:8000`.
- Production backend uses Vercel environment variables and Supabase Postgres.
- Production frontend uses Vercel environment variables and talks to
  `https://api.ourframe.nitinkotcherlakota.com`.

Do not commit real secrets. Any value in `.env.local` or Vercel Environment
Variables should stay out of Git.

## Where To Paste Things

Use this as the quick map before following the full guide.

| Thing | Copy it from | Paste it into |
|---|---|---|
| Local backend values | Google Cloud, Supabase, generated secrets | `backend/.env.local` |
| Local frontend values | Supabase, local backend URL | `frontend/.env.local` |
| Production backend values | Supabase, Google Cloud, generated secrets | Vercel project `our-frame-api` -> **Settings -> Environment Variables** |
| Production frontend values | Supabase, production API URL | Vercel project `our-frame-web` -> **Settings -> Environment Variables** |
| Supabase migration SQL | `supabase/migrations/0001_schema.sql` | Prefer CLI `npx supabase db push --dry-run`, then `npx supabase db push`; SQL Editor only as fallback |
| Google OAuth redirect URLs | This guide | Google Cloud project -> **APIs & Services -> Credentials -> OAuth client -> Authorized redirect URIs** |
| Vercel domain records | Vercel project domain screen | Your domain DNS provider for `nitinkotcherlakota.com` |

In Vercel, paste environment variables one row at a time:

```text
Name: DATABASE_URL
Value: postgresql+psycopg://...
Environment: Production
```

Repeat that pattern for every backend and frontend variable listed below.

## Architecture

Our Frame is split into two deployed services:

```text
Browser
  -> Frontend: Next.js on Vercel
  -> Backend API: FastAPI on Vercel
  -> Supabase Postgres and Storage
  -> Google Drive API for original photos/videos
```

Important difference from HomeBase: Our Frame does not use Supabase Auth. Google
OAuth signs users in, and FastAPI stores the app session. Supabase is used for
production Postgres and private generated media storage.

## Account Order

Create and configure accounts in this order:

1. GitHub account and repository access
2. Supabase account and Our Frame project
3. Google Cloud project for Drive/OAuth
4. Vercel account connected to GitHub
5. DNS records for `ourframe` and `api.ourframe`

The reason for this order: Vercel needs the repo, Vercel env vars need Supabase
and Google values, and Google OAuth needs the final callback URLs.

## 1. GitHub

Use GitHub as the source for Vercel deployments.

1. Create or sign in to a GitHub account.
2. Push this repository to GitHub if it is not already there.
3. Keep `main` as the production branch.

Vercel will create:

- Production deployments from `main`
- Preview deployments from other branches or pull requests

No automated workflow should run Supabase migrations against production. You
will apply migrations manually after reviewing a dry run.

## 2. Supabase Account And Project

### Create The Account

1. Go to `https://supabase.com`.
2. Sign in or create an account.
3. Create a new project for Our Frame.
4. Choose the free plan.
5. Save your database password somewhere safe. You will need it for
   `DATABASE_URL`.

### Find The Project Ref

Open the Supabase dashboard for the project. The URL looks like:

```text
https://supabase.com/dashboard/project/<project-ref>
```

The `<project-ref>` is used in CLI commands and URLs.

### Find Supabase URL And Keys

In the Supabase dashboard:

1. Select the Our Frame project.
2. Click **Connect** in the top bar for connection strings and project URL.
3. Open **Settings** with the gear icon.
4. Open **API Keys**.
5. Copy:
   - `SUPABASE_URL`: `https://<project-ref>.supabase.co`
   - Publishable key: `sb_publishable_...`
   - Secret key: `sb_secret_...`

The publishable key is safe for frontend use. The secret key is backend-only.
Never put the secret key in `NEXT_PUBLIC_*`.

Paste these values into these exact places:

```text
SUPABASE_URL
  -> backend/.env.local for local backend if testing Supabase locally
  -> Vercel our-frame-api -> Settings -> Environment Variables

SUPABASE_PUBLISHABLE_KEY
  -> backend/.env.local for local backend if testing Supabase locally
  -> Vercel our-frame-api -> Settings -> Environment Variables

SUPABASE_SECRET_KEY
  -> backend/.env.local only if intentionally testing production-like storage locally
  -> Vercel our-frame-api -> Settings -> Environment Variables
  -> Never paste into frontend/.env.local
  -> Never paste into Vercel our-frame-web

NEXT_PUBLIC_SUPABASE_URL
  -> frontend/.env.local
  -> Vercel our-frame-web -> Settings -> Environment Variables

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  -> frontend/.env.local
  -> Vercel our-frame-web -> Settings -> Environment Variables
```

### Get The Database URL

In Supabase:

1. Click **Connect**.
2. Choose the pooled connection string for Postgres.
3. Use the database password you saved when creating the project.
4. For this FastAPI backend, change the URL scheme from:

```text
postgresql://
```

to:

```text
postgresql+psycopg://
```

Production example:

```text
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Paste `DATABASE_URL` into:

```text
Vercel -> our-frame-api -> Settings -> Environment Variables
```

Do not paste `DATABASE_URL` into the frontend project or any `NEXT_PUBLIC_*`
variable.

### Apply Supabase Migrations

Migrations live in:

```text
supabase/migrations/
```

The first migration is:

```text
supabase/migrations/0001_schema.sql
```

Use the CLI dry-run flow before applying:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
```

Read the dry-run output. If anything looks unexpected, stop and inspect the SQL.

Only after the dry run looks correct:

```bash
npx supabase db push
```

`db push` applies only migrations that are not already recorded in Supabase's
migration history.

Fallback paste location if the CLI is unavailable:

```text
Supabase -> SQL Editor -> New query
```

Paste the full contents of `supabase/migrations/0001_schema.sql`, then click
**Run**. Use this only for first setup if the CLI path is blocked.

### Verify Supabase Tables

After applying migrations, open **Table Editor** and confirm these tables exist:

```text
users
user_sessions
workspaces
workspace_members
drive_connections
albums
photos
favorites
section_mappings
ai_results
audit_logs
media_items
media_derivatives
```

### Verify Supabase Storage

Open **Storage** and confirm this bucket exists:

```text
our-frame-media-cache
```

It should be private, not public.

### Verification SQL

You can also verify from **SQL Editor**:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'user_sessions',
    'workspaces',
    'workspace_members',
    'drive_connections',
    'albums',
    'photos',
    'favorites',
    'section_mappings',
    'ai_results',
    'audit_logs',
    'media_items',
    'media_derivatives'
  )
order by table_name;

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in (
    'users',
    'user_sessions',
    'workspaces',
    'workspace_members',
    'drive_connections',
    'albums',
    'photos',
    'favorites',
    'section_mappings',
    'ai_results',
    'audit_logs',
    'media_items',
    'media_derivatives'
  )
order by relname;

select id, name, public
from storage.buckets
where id = 'our-frame-media-cache';
```

Expected:

- 13 app tables exist.
- RLS is enabled on all 13 app tables.
- `our-frame-media-cache` exists and `public` is `false`.

## 3. Google Cloud And Google Drive

### Create The Google Cloud Project

1. Go to `https://console.cloud.google.com`.
2. Create a new project named something like `Our Frame`.
3. Open **APIs & Services -> Library**.
4. Enable **Google Drive API**.

### Configure OAuth Consent

1. Open **APIs & Services -> OAuth consent screen**.
2. Choose **External** unless your account is managed by a Google Workspace.
3. Fill in app name, support email, and developer contact email.
4. Add your own Google account as a test user if the app is in testing mode.

### Create OAuth Credentials

1. Open **APIs & Services -> Credentials**.
2. Click **Create Credentials**.
3. Choose **OAuth client ID**.
4. Application type: **Web application**.
5. Name it `Our Frame Web`.

Add local redirect URIs:

```text
http://localhost:8000/auth/callback
http://localhost:8000/api/drive/callback
```

Add production redirect URIs:

```text
https://api.ourframe.nitinkotcherlakota.com/auth/callback
https://api.ourframe.nitinkotcherlakota.com/api/drive/callback
```

Paste all four redirect URLs into:

```text
Google Cloud Console
-> APIs & Services
-> Credentials
-> OAuth 2.0 Client IDs
-> Our Frame Web
-> Authorized redirect URIs
```

Save:

- Google Client ID
- Google Client Secret

Paste them into:

```text
GOOGLE_CLIENT_ID
  -> backend/.env.local
  -> Vercel our-frame-api -> Settings -> Environment Variables

GOOGLE_CLIENT_SECRET
  -> backend/.env.local
  -> Vercel our-frame-api -> Settings -> Environment Variables
```

Do not paste `GOOGLE_CLIENT_SECRET` into `frontend/.env.local` or the frontend
Vercel project.

The same OAuth client can contain both local and production redirect URLs. The
environment variables decide which redirect URL the backend uses.

### Prepare Google Drive

1. Open Google Drive with the Google account you will use for Our Frame.
2. Create or choose the root family media folder.
3. Copy the folder ID from the URL:

```text
https://drive.google.com/drive/folders/<folder-id>
```

Use `<folder-id>` as `GOOGLE_DRIVE_ROOT_FOLDER` locally if you use the legacy
single-root flow.

Paste the folder ID into:

```text
backend/.env.local -> GOOGLE_DRIVE_ROOT_FOLDER=<folder-id>
```

## 4. Local Development Setup

Local development should stay separate from production.

Local backend:

- Uses `backend/.env.local`
- Uses SQLite by default
- Uses local Google OAuth redirects
- Writes local derivative files to `backend/data/media-cache`

Local frontend:

- Uses `frontend/.env.local`
- Talks to local backend at `http://localhost:8000`

### Install Dependencies

From the repo root:

```bash
npm run install:all
```

If the backend virtualenv is not created by that command, run:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ..
```

### Create Local Backend Env

```bash
cp backend/.env.example backend/.env.local
```

Fill in `backend/.env.local` for local development:

```text
GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_OAUTH_REDIRECT=http://localhost:8000/auth/callback
GOOGLE_DRIVE_OAUTH_REDIRECT=http://localhost:8000/api/drive/callback
GOOGLE_DRIVE_ROOT_FOLDER=<google-drive-folder-id>

FRONTEND_ROOT=http://localhost:3000
DATABASE_URL=sqlite:///./data/ourframe.db
DEBUG=false

MEDIA_STORAGE_BACKEND=local
MEDIA_CACHE_ROOT=./data/media-cache

SESSION_SECRET=<local-random-secret>
SESSION_TTL_SECONDS=604800
TOKEN_ENCRYPTION_KEY=<local-fernet-key>
```

Paste this whole block into:

```text
backend/.env.local
```

Replace every `<...>` placeholder with the real local value.

Generate local secrets:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
cd backend
.venv/bin/python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
cd ..
```

Do not put production Supabase secrets in local env unless you intentionally
want local code to talk to production.

### Create Local Frontend Env

```bash
cp frontend/.env.example frontend/.env.local
```

For local development:

```text
NEXT_PUBLIC_API_BASE=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Paste this block into:

```text
frontend/.env.local
```

For normal local development, `NEXT_PUBLIC_API_BASE` should stay
`http://localhost:8000`.

Only `NEXT_PUBLIC_*` values belong in `frontend/.env.local`. Never put
`SUPABASE_SECRET_KEY`, Google client secrets, database passwords, or token
encryption keys in the frontend.

### Run Locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Sign in with Google. The backend will use:

```text
http://localhost:8000/auth/callback
```

for the local login callback.

## 5. Vercel Account And Projects

### Create The Vercel Account

1. Go to `https://vercel.com`.
2. Sign in with GitHub.
3. Allow Vercel to access the Our Frame repository.
4. Stay on the Hobby/free plan.

### Create Backend Project

Create a new Vercel project:

```text
Project name: our-frame-api
Root directory: backend
Framework preset: Other
Production branch: main
```

The backend project uses:

```text
backend/vercel.json
backend/api/index.py
backend/.python-version
```

Add the backend domain:

```text
api.ourframe.nitinkotcherlakota.com
```

Paste this domain into:

```text
Vercel -> our-frame-api -> Settings -> Domains
```

### Backend Production Environment Variables

Add these in Vercel **Project Settings -> Environment Variables** for the
backend project. Apply them to **Production**. Add them to **Preview** too only
if you want preview deployments to use the same production services.

```text
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
FRONTEND_ROOT=https://ourframe.nitinkotcherlakota.com

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_OAUTH_REDIRECT=https://api.ourframe.nitinkotcherlakota.com/auth/callback
GOOGLE_DRIVE_OAUTH_REDIRECT=https://api.ourframe.nitinkotcherlakota.com/api/drive/callback

SESSION_SECRET=<strong-random-hex>
SESSION_TTL_SECONDS=604800
TOKEN_ENCRYPTION_KEY=<fernet-key>

MEDIA_STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_MEDIA_BUCKET=our-frame-media-cache

DEBUG=false
```

Paste each line into:

```text
Vercel -> our-frame-api -> Settings -> Environment Variables
```

Use the variable name on the left of `=` as **Name** and the value on the right
as **Value**. Example:

```text
Name: FRONTEND_ROOT
Value: https://ourframe.nitinkotcherlakota.com
Environment: Production
```

Generate production secrets locally and paste into Vercel:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
cd backend
.venv/bin/python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
cd ..
```

Never put these backend secrets into the frontend Vercel project.

### Create Frontend Project

Create a second Vercel project:

```text
Project name: our-frame-web
Root directory: frontend
Framework preset: Next.js
Production branch: main
```

Add the frontend domain:

```text
ourframe.nitinkotcherlakota.com
```

Paste this domain into:

```text
Vercel -> our-frame-web -> Settings -> Domains
```

### Frontend Production Environment Variables

Add these in Vercel **Project Settings -> Environment Variables** for the
frontend project. Apply them to **Production**. Add them to **Preview** too only
if previews should talk to the same backend/Supabase project.

```text
NEXT_PUBLIC_API_BASE=https://api.ourframe.nitinkotcherlakota.com
NEXT_PUBLIC_SITE_URL=https://ourframe.nitinkotcherlakota.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Paste each line into:

```text
Vercel -> our-frame-web -> Settings -> Environment Variables
```

Use the variable name on the left of `=` as **Name** and the value on the right
as **Value**.

These values are public because `NEXT_PUBLIC_*` variables are bundled into the
browser JavaScript.

## 6. DNS

You already own:

```text
nitinkotcherlakota.com
```

In Vercel, after adding each custom domain, Vercel will show the exact DNS
record to create. Use the exact values Vercel shows.

Usually the records are:

```text
Type: CNAME
Name: ourframe
Value: cname.vercel-dns.com
```

```text
Type: CNAME
Name: api.ourframe
Value: cname.vercel-dns.com
```

Paste these DNS records into wherever `nitinkotcherlakota.com` DNS is managed,
for example your domain registrar's DNS page. If Vercel shows a different
record, paste Vercel's exact record instead of the examples above.

If your DNS provider asks for the full host, use:

```text
ourframe.nitinkotcherlakota.com
api.ourframe.nitinkotcherlakota.com
```

Wait for Vercel to show the domains as valid.

## 7. Production Deploy Order

Use this order every time you set up or change production:

1. Push code to GitHub.
2. Confirm Supabase migrations are ready.
3. Run:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
```

4. If the dry run is correct, run:

```bash
npx supabase db push
```

5. Verify Supabase tables and storage.
6. Verify Google OAuth redirect URIs include production URLs.
7. Verify backend Vercel environment variables.
8. Deploy backend Vercel project.
9. Verify:

```text
https://api.ourframe.nitinkotcherlakota.com/health
```

10. Verify frontend Vercel environment variables.
11. Deploy frontend Vercel project.
12. Open:

```text
https://ourframe.nitinkotcherlakota.com
```

13. Sign in with Google.
14. Confirm you land on `/home`.
15. Connect Google Drive if prompted.
16. Select the root Drive folder if prompted.
17. Confirm albums/photos load.

## 8. Verification Checklist

### Backend Health

Open:

```text
https://api.ourframe.nitinkotcherlakota.com/health
```

Expected:

```json
{"ok":true,"version":"2.0"}
```

### Frontend

Open:

```text
https://ourframe.nitinkotcherlakota.com
```

Expected:

- The site loads.
- Login starts Google OAuth.
- Google redirects back to the API domain.
- The API redirects back to the frontend.
- The session is remembered.
- Clicking Home does not send you back to login.

### Supabase

In Supabase:

- Table Editor shows all app tables.
- Storage shows `our-frame-media-cache`.
- Vercel backend `DATABASE_URL` points to this same project.

### Google Drive

Expected:

- Google Drive OAuth consent asks for read-only Drive access.
- The chosen Google account has access to the root folder.
- Albums and photos appear after sync.

## 9. Database Change Rules

A database change is anything that changes:

- tables
- columns
- indexes
- constraints
- RLS settings
- Postgres functions
- triggers
- storage policies
- grants

Rules:

- Add a migration under `supabase/migrations/`.
- Review SQL manually.
- Always run `npx supabase db push --dry-run` before applying.
- Only run `npx supabase db push` after the dry run is correct.
- Do not automate production migrations from CI.
- Do not edit migrations after they have been applied to production.
- Do not disable RLS as a shortcut.
- Do not broadly grant access to `anon`.
- Do not run destructive SQL such as `DROP TABLE`, `TRUNCATE`, unscoped
  `DELETE`, `ALTER COLUMN TYPE`, or `CASCADE` unless you have explicitly
  reasoned through the production data impact.

## 10. Environment Separation

### Local Backend

File:

```text
backend/.env.local
```

Purpose:

- local Google OAuth
- local SQLite
- local media cache
- local secrets

Do not commit it.

### Local Frontend

File:

```text
frontend/.env.local
```

Purpose:

- local API URL
- public Supabase URL and publishable key if needed

Do not commit it.

### Production Backend

Location:

```text
Vercel -> our-frame-api -> Settings -> Environment Variables
```

Purpose:

- Supabase database URL
- Google client secret
- session secret
- token encryption key
- Supabase secret key
- production OAuth redirects

### Production Frontend

Location:

```text
Vercel -> our-frame-web -> Settings -> Environment Variables
```

Purpose:

- production API URL
- production site URL
- public Supabase URL
- public Supabase publishable key

## 11. Current Production Caveat

The Supabase Storage adapter is implemented. When `MEDIA_STORAGE_BACKEND=supabase`
(set in the backend Vercel project), generated photo thumbnails/grid/preview
derivatives upload to the private `our-frame-media-cache` bucket and are served
through short-lived signed-URL redirects. Photos are production-ready on Vercel.

Video is not. `ffmpeg`/`ffprobe` are not available in Vercel's Python serverless
runtime, and video poster extraction / MP4 transcoding need real binaries plus
multi-minute runtimes that exceed Vercel's function duration limits. As deployed
today, video processing fails visibly (`processing_status="failed"`, not a crash)
rather than producing posters or playback derivatives.

To make video work, the backend (or just its video-processing path) needs to run
somewhere with ffmpeg and longer execution time — e.g. Render or Fly.io — rather
than as a Vercel serverless function. This is a follow-up task, not yet done.

## 12. Troubleshooting

### Login Redirects Back To Login

Check:

- `FRONTEND_ROOT` in backend Vercel is
  `https://ourframe.nitinkotcherlakota.com`.
- `NEXT_PUBLIC_API_BASE` in frontend Vercel is
  `https://api.ourframe.nitinkotcherlakota.com`.
- Google Cloud redirect URIs include both production callback URLs.
- Browser cookies are not blocked.

### Backend Health Fails

Check:

- Backend Vercel deployment logs.
- `DATABASE_URL`.
- Python build logs.
- `backend/vercel.json`.

### Supabase Migration Dry Run Looks Wrong

Stop. Do not apply. Check:

- Are you linked to the right project ref?
- Does the migration contain unexpected destructive SQL?
- Is the target database already modified manually?

### Production Has No Data

Check:

- Did you run `npx supabase db push` against the same project Vercel uses?
- Does backend `DATABASE_URL` point to the same Supabase project?
- Did Google Drive sync run after signing in?

### Photos Or Videos Are Slow

Expected until the Supabase Storage adapter is finished. Originals are still in
Google Drive, and generated derivatives need durable object storage for best
production performance.

## 13. Quick Reference

Local:

```bash
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local
npm run install:all
npm run dev
```

Production migration:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --dry-run
npx supabase db push
```

Production URLs:

```text
https://api.ourframe.nitinkotcherlakota.com/health
https://ourframe.nitinkotcherlakota.com
```
