# Our Frame

Our Frame is a personal photo hub that:

- Pulls photos from a Google Drive folder
- Displays them in a modern React frontend (Home, Gallery, Albums, Favorites)
- Uses a FastAPI backend to:
  - Handle Google OAuth2
  - Access the Google Drive API
  - Serve thumbnails, previews, and downloads efficiently

This README walks through **backend setup**, **frontend setup**, and **Google Drive OAuth configuration** from scratch.

---

# 📁 Project Structure

```
project-root/
  frontend/
    src/
      App.tsx
      pages/
        Home.tsx
        Gallery.tsx
        Albums.tsx
        Favorites.tsx
      components/
        Sidebar.tsx
        Header.tsx
        PhotoCard.tsx
        ...
    package.json
    vite.config.ts
  backend/
    main.py
    config.py
    auth/
      __init__.py
      routes.py
    drive/
      __init__.py
      routes.py
      service.py
      image_utils.py
    utils/
      __init__.py
      responses.py
    google_drive_client.py
    .env
    token.json (auto-created after OAuth)
```

> **Important**: `auth/`, `drive/`, and `utils/` must include `__init__.py`.

---

# 🐍 Backend Setup (FastAPI)

## 1. Create and activate a Python virtual environment

```bash
cd backend

# Create venv (once)
python3 -m venv .venv

# Activate (macOS/Linux)
source .venv/bin/activate

# OR Windows
# .\.venv\Scripts\Activate.ps1
```

## 2. Install backend dependencies

```bash
pip install -r requirements.txt
```

Or manually:

```bash
pip install fastapi uvicorn[standard] python-dotenv google-api-python-client google-auth google-auth-oauthlib Pillow
```

---

# ⚙️ Backend Environment Variables (`backend/.env`)

Create or edit:

```
backend/.env
```

Add:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT=http://localhost:8000/auth/callback

# Root Google Drive folder (your main photos folder)
ROOT_FOLDER_ID=your-google-drive-folder-id
GOOGLE_DRIVE_ROOT_FOLDER=your-google-drive-folder-id

# Token storage location
GOOGLE_TOKEN_PATH=token.json

# Where auth callback redirects after saving token
FRONTEND_ROOT=http://localhost:5173
```

Rules:

- No quotes  
- No spaces around `=`  
- Folder ID is taken from a Drive folder link  

---

# ☁️ Google Cloud Setup (OAuth + Drive API)

## 1. Create/select a Google Cloud project

Go to:

👉 https://console.cloud.google.com/apis/credentials

Use an existing project or create a new one (e.g., **our-frame**).

---

## 2. Enable the Google Drive API

Left menu:

```
APIs & Services → Library
```

Search:

```
Google Drive API
```

Click **Enable**.

---

## 3. Configure the OAuth Consent Screen

Left menu:

```
APIs & Services → OAuth consent screen
```

- App name: **Our Frame**  
- User support email: your email  
- Developer contact email: your email  
- Scopes: default is fine  
- **Test Users** → Add your Google account (important!)  
- Save  

---

## 4. Create OAuth client (Web Application)

Go to:

```
APIs & Services → Credentials → Create Credentials → OAuth client ID
```

Choose:

- **Application type:** Web application  
- **Name:** `our-frame-local`

### Authorized JavaScript origins (optional)

```
http://localhost:5173
http://localhost:3000
```

### Authorized redirect URI (**required**)

```
http://localhost:8000/auth/callback
```

Click **Create**.

Copy:

- **Client ID**  
- **Client Secret**  

→ Put them into `backend/.env`.

---

# 🚀 Running the Backend

From within `backend/`:

```bash
source .venv/bin/activate
uvicorn main:app --reload --port=8000
```

Test:

- http://localhost:8000/  
- http://localhost:8000/docs  

Debug env:

```
http://localhost:8000/debug/env
```

---

# 🔑 OAuth Flow (first-time setup only)

1. Start backend  
2. Visit:

```
http://localhost:8000/auth/start
```

3. Log in with your test-user Google account  
4. Approve Drive permissions  
5. Redirect back to:

```
http://localhost:8000/auth/callback?code=...
```

6. Backend writes `token.json`  
7. Redirects to frontend

Check:

```bash
ls backend/token*
```

---

# 🗂️ Test Drive Access

Go to:

```
http://localhost:8000/drive/children
```

Expect:

```json
{
  "parentId": "...",
  "folders": [...],
  "files": [...]
}
```

---

# 💻 Frontend Setup (React + Vite)

## 1. Install dependencies

```bash
cd frontend
npm install
```

## 2. Configure frontend `.env`

Create:

```
frontend/.env
```

Add:

```env
VITE_API_BASE=http://localhost:8000
```

## 3. Start the frontend

```bash
npm run dev
```

Default:

```
http://localhost:5173
```

---

# 🛠 Troubleshooting

### `/auth/start` → "Google OAuth not configured"
Your `.env` is missing or backend wasn't restarted.

### `needsAuth` in `/drive/children`
Run OAuth flow again:  
`http://localhost:8000/auth/start`

### `ReauthRequired: No local token.json`
Token wasn't created → finish OAuth flow fully.

### Frontend "Network Error"
Backend likely returning 500 → open `/drive/children` directly.

---

# 🎉 Summary

- FastAPI backend handles OAuth + Drive API  
- React frontend displays Drive photos beautifully  
- OAuth writes `token.json` once  
- Then everything works automatically  

Enjoy running **Our Frame** locally with real Google Drive photos! 🎨📸✨
