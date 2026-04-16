# Our Frame

A private family photo vault powered by Google Drive. Browse albums, save favorites, and relive memories — from a warm, minimal interface designed to keep photos as the hero.

---

## Features

- **Google Drive Integration** — Your existing Drive folder structure becomes your album library. No migration needed.
- **Full-Window Hero Slideshow** — Cinematic, full-viewport crossfade carousel with a Ken Burns effect.
- **Albums** — Nested folder browsing with cover images, sub-album support, and a full lightbox viewer.
- **Favorites** — Heart any photo. Revisit your curated collection from the home page or the Favorites view.
- **On This Day** — Photos from this month and day in past years surface automatically.
- **HEIC Support** — iPhone photos (HEIC/HEIF) are auto-converted for the browser.
- **Optimized Thumbnails** — Images are resized and cached server-side for fast loads.
- **Warm Memory Book UI** — A cohesive design system built around warmth, whitespace, and letting photos breathe.
- **AI Features** *(coming soon)* — Photo tagging, semantic search, and story generation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React 19, TypeScript, Tailwind CSS v4 |
| UI Components | shadcn/ui, Lucide React, Framer Motion |
| Data Fetching | TanStack Query (React Query) v5 |
| Backend | FastAPI, Uvicorn, Python 3.11+ |
| Database | SQLite via SQLModel + SQLAlchemy 2 |
| Auth | Google OAuth 2.0 |
| Storage | Google Drive API (read-only) |
| Image Processing | Pillow, pillow-heif (HEIC/HEIF) |
| AI (optional) | OpenAI API, LangChain |

---

## Architecture

The app is split into two services that run together:

- **Backend** — FastAPI Python server. Reads your Google Drive, caches metadata in SQLite, serves a REST API, and proxies image files with HEIC conversion and thumbnail resizing.
- **Frontend** — Next.js app. Consumes the backend API and renders the editorial UI.

The backend reads your Drive folder structure: each subfolder inside your root Drive folder becomes an album. Photo metadata is stored locally in `backend/data/ourframe.db` for fast queries.

```
our-frame/
├── backend/
│   ├── api/                    # Versioned API routes (albums, favorites, home, drive)
│   ├── auth/                   # Google OAuth routes
│   ├── core/                   # Config (Pydantic settings) + DB session
│   ├── models/                 # SQLModel table definitions
│   ├── repositories/           # Data access layer
│   ├── schemas/                # Pydantic response models
│   ├── services/               # Business logic
│   ├── drive/                  # Drive API wrapper + image utils
│   ├── data/                   # SQLite DB + cache (gitignored)
│   ├── main.py                 # FastAPI app entry point
│   └── requirements.txt
│
├── frontend/                   # Next.js app
│   ├── app/                    # App Router pages (home, albums, favorites, memories)
│   ├── components/             # UI components
│   ├── hooks/                  # React Query hooks
│   ├── lib/                    # API client, query keys, utils
│   └── types/                  # TypeScript interfaces
│
├── docs/                       # Deeper documentation
└── package.json                # Root scripts (runs both services)
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A [Google Cloud project](https://console.cloud.google.com/) with:
  - Google Drive API enabled
  - OAuth 2.0 credentials (Web Application type)
- A Google Drive folder containing your photos

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/our-frame.git
cd our-frame
```

### 2. Configure Google Cloud

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Enable the **Google Drive API** under APIs & Services → Library
3. Configure the **OAuth consent screen** (add your Google account as a test user)
4. Create an **OAuth 2.0 Client ID** (Web Application) with:
   - Authorized redirect URI: `http://localhost:8000/auth/callback`
5. Note your **Client ID** and **Client Secret**

### 3. Backend environment

Create `backend/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT=http://localhost:8000/auth/callback

# Your Google Drive root folder
# Find the ID in the URL: drive.google.com/drive/folders/<ID>
GOOGLE_DRIVE_ROOT_FOLDER=your-google-drive-folder-id

# Where to store the OAuth token (auto-created on first login)
GOOGLE_TOKEN_PATH=token.json

# Frontend URL — used after OAuth redirect
FRONTEND_ROOT=http://localhost:3000

# Optional: enable AI features
# OPENAI_API_KEY=sk-...
# AI_ENABLED=true
```

### 4. Frontend environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

### 5. Install dependencies

```bash
# From the repo root
npm run install:all

# Or manually:
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
cd frontend && npm install
```

---

## Running Locally

```bash
# Start both frontend and backend together (recommended)
npm run dev

# Or individually:
npm run dev:backend    # FastAPI on http://localhost:8000
npm run dev:frontend   # Next.js on http://localhost:3000
```

### First run — authenticate with Google

1. Open [http://localhost:3000](http://localhost:3000)
2. If not authenticated, you'll be redirected to Google's OAuth consent screen
3. Grant read-only Drive access
4. You're in — your photos start loading from Drive

> The OAuth token is saved as `backend/token.json` and auto-refreshed.
> In Google Cloud test mode, refresh tokens expire after 7 days — re-authenticate via `/auth/start`.

---

## Building for Production

```bash
npm run build          # Builds Next.js frontend to frontend/.next/
npm run start:backend  # Runs FastAPI without hot reload
```

For production, serve the Next.js app with `npm start` (inside `frontend/`) and run FastAPI behind a reverse proxy (Nginx or Caddy).

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "Google OAuth not configured" | Check `backend/.env` has valid credentials and restart the backend |
| Frontend shows auth error | Navigate to `http://localhost:8000/auth/start` and complete the OAuth flow |
| `No local token.json` | The OAuth flow didn't complete — try `/auth/start` again |
| Photos not loading | Check the Drive API is enabled and the root folder ID is correct |
| HEIC photos blank | Ensure `pillow-heif` is installed: `pip install pillow-heif` |

---

## Roadmap

- [ ] Drive sync on-demand (currently requires manual restart)
- [ ] AI photo tagging and semantic search
- [ ] Video support
- [ ] Mobile PWA support
- [ ] Family story generation from photo sequences
- [ ] Multi-user / shared family access

---

## Documentation

| Doc | Description |
|---|---|
| [docs/api.md](docs/api.md) | Full REST API reference |
| [docs/frontend.md](docs/frontend.md) | Frontend architecture, components, hooks, and types |
| [docs/design-system.md](docs/design-system.md) | Design tokens, typography, color palette, and component recipes |
| [frontend/README.md](frontend/README.md) | Frontend quick-start |

---

## License

[MIT](LICENSE)
