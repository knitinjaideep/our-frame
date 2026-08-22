# Our Frame Vercel + Supabase Deployment

This deployment keeps the free path:

- Vercel Hobby for frontend
- Vercel Hobby for backend API
- Supabase Free for Postgres and private derivative storage
- Custom frontend domain: `ourframe.nitinkotcherlakota.com`

Do not commit real secrets. Add real values only in Vercel Environment Variables.

## Supabase

Create these resources in your second Supabase project:

1. Postgres database, already included with the project.
2. Private Storage bucket:

```text
our-frame-media-cache
```

Create a private bucket from **Storage**:

```text
Bucket name: our-frame-media-cache
Public bucket: off
```

Copy these values:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Where to find them in the current Supabase dashboard:

1. Select your Supabase project.
2. Click **Connect** in the top bar. Use this for the project URL and the database connection string.
3. Open **Settings** with the gear icon, then **API Keys**. Copy the **Publishable key** for `SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Copy the **Secret key** for backend `SUPABASE_SECRET_KEY` only.
4. If you do not see the URL in **Connect**, open **Integrations** then **Data API**. The Data API URL is the `SUPABASE_URL`.

Use the pooled connection string for Vercel. If Supabase gives you a URL starting with `postgresql://`, change it to `postgresql+psycopg://` for this backend.

Never create `NEXT_PUBLIC_SUPABASE_SECRET_KEY` or `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

## Google OAuth

In Google Cloud Console, add these Authorized Redirect URIs:

```text
https://our-frame-api.vercel.app/auth/callback
https://our-frame-api.vercel.app/api/drive/callback
```

Keep local redirect URIs too:

```text
http://localhost:8000/auth/callback
http://localhost:8000/api/drive/callback
```

## Backend Vercel Project

Create a Vercel project:

```text
Project name: our-frame-api
Root directory: backend
Framework preset: Other
Production branch: main
```

The backend uses:

```text
backend/vercel.json
backend/api/index.py
backend/.python-version
```

Set these Vercel environment variables:

```text
DATABASE_URL=postgresql+psycopg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
FRONTEND_ROOT=https://ourframe.nitinkotcherlakota.com

GOOGLE_CLIENT_ID=<google-client-id>
GOOGLE_CLIENT_SECRET=<google-client-secret>
GOOGLE_OAUTH_REDIRECT=https://our-frame-api.vercel.app/auth/callback
GOOGLE_DRIVE_OAUTH_REDIRECT=https://our-frame-api.vercel.app/api/drive/callback

SESSION_SECRET=<openssl-rand-hex-32-output>
SESSION_TTL_SECONDS=604800
TOKEN_ENCRYPTION_KEY=<fernet-key-output>

MEDIA_STORAGE_BACKEND=supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SUPABASE_SECRET_KEY=<sb_secret_...>
SUPABASE_MEDIA_BUCKET=our-frame-media-cache

DEBUG=false
```

Generate values locally:

```bash
openssl rand -hex 32
cd backend
.venv/bin/python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Frontend Vercel Project

Create a second Vercel project:

```text
Project name: our-frame-web
Root directory: frontend
Framework preset: Next.js
Production branch: main
```

Set these Vercel environment variables:

```text
NEXT_PUBLIC_API_BASE=https://our-frame-api.vercel.app
NEXT_PUBLIC_SITE_URL=https://ourframe.nitinkotcherlakota.com
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
```

## Domain

In the frontend Vercel project, add:

```text
ourframe.nitinkotcherlakota.com
```

In your domain DNS provider, create the DNS record Vercel shows. Usually:

```text
Type: CNAME
Name: ourframe
Value: cname.vercel-dns.com
```

Use the exact value shown by Vercel.

## First Verification

After both deployments finish:

```text
https://our-frame-api.vercel.app/health
https://ourframe.nitinkotcherlakota.com
```

Then:

1. Sign in with Google.
2. Confirm the app lands on `/home`.
3. Connect Google Drive if needed.
4. Choose the root folder.
5. Run poster processing slowly from an admin session:

```text
POST https://our-frame-api.vercel.app/api/admin/media/process?limit=25
```

6. Process MP4 playback only in small batches:

```text
POST https://our-frame-api.vercel.app/api/admin/media/process?media_type=video&include_playback=true&limit=1
```

## Free Tier Notes

Keep video MP4 processing selective. Supabase Free storage and egress are limited, and Vercel Hobby functions have execution limits.

Current code has placeholders for Supabase Storage settings. Before production media processing, confirm the active storage adapter writes derivatives to Supabase Storage instead of local disk.
