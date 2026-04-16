# API Reference

The Our Frame backend exposes a REST API served by FastAPI at `http://localhost:8000`.

All endpoints require the user to be authenticated via Google OAuth. The frontend automatically redirects to `/auth/start` on any `401` response.

---

## Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/start` | Initiate Google OAuth flow — redirects to Google consent screen |
| GET | `/auth/callback` | OAuth redirect handler — exchanges code for tokens, redirects to frontend |
| GET | `/auth/status` | Returns `{ authenticated: bool }` — used by the frontend to gate access |

---

## Home

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/home/feed` | Single call returning hero photos, featured albums, recent albums, throwbacks, and stats |

---

## Albums

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/albums` | List all root albums (Drive folders) |
| GET | `/albums/:id` | Album detail: metadata + photos + sub-albums |

---

## Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/favorites` | List all favorited photos |
| POST | `/favorites` | Add a photo to favorites |
| DELETE | `/favorites/:id` | Remove a photo from favorites |

---

## Drive (Media Proxy)

The Drive proxy handles image serving with server-side HEIC conversion and thumbnail resizing.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/drive/file/:id/thumbnail?s=<px>` | Thumbnail (64–2000px) |
| GET | `/drive/file/:id/preview?w=<px>` | Preview image (400–4096px) |
| GET | `/drive/file/:id/download` | Original file download |

---

## Interactive Docs

When the backend is running, full interactive API documentation is available at:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
