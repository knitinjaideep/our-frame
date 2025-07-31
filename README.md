# Our Frame

A modular website that combines:
- Personal photography portfolio
- Smart baby journal with voice AI
- Video and memory archive
- AI-powered tagging and transcription

Built with: Next.js, FastAPI, Supabase, LangChain, MCP Server, Kubernetes

## Photo Gallery Module

The photo gallery module displays images from Google Drive in a beautiful, responsive interface.

### Features

- 🖼️ Beautiful photo grid layout
- 🔄 Real-time refresh functionality
- 📱 Responsive design for all devices
- ⚡ Fast loading with lazy image loading
- 🎨 Modern UI with smooth animations
- 🔗 Direct links to original photos

### Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `backend` directory:
   ```
   GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
   ```

3. **Set up Google Drive API:**
   - Place your `client_secrets.json` file in the `backend` directory
   - Run the backend once to authenticate with Google Drive

4. **Start the application:**
   ```bash
   npm run dev
   ```
   This will start both the backend (port 8000) and frontend (port 3000)

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Individual Components

#### Backend (FastAPI)
- **Location:** `backend/`
- **Port:** 8000
- **Start:** `npm run dev:backend`

#### Frontend (React + Vite)
- **Location:** `frontend/`
- **Port:** 3000
- **Start:** `npm run dev:frontend`

### Development

- **Backend:** FastAPI with Google Drive API integration
- **Frontend:** React 18 with TypeScript, Vite, and modern CSS
- **Styling:** Custom CSS with Grid and Flexbox
- **Icons:** Lucide React
- **HTTP Client:** Axios

### Project Structure

```
our-frame/
├── backend/           # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── google_drive_client.py  # Google Drive integration
│   └── client_secrets.json     # Google API credentials
├── frontend/         # React frontend
│   ├── src/
│   │   ├── App.tsx   # Main component
│   │   └── App.css   # Styles
│   └── package.json
└── package.json      # Root scripts
```

### API Endpoints

- `GET /photos/sync` - Fetch photos from Google Drive folder

### Environment Variables

- `GOOGLE_DRIVE_FOLDER_ID` - The ID of your Google Drive folder containing images
