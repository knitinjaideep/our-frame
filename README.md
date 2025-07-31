# Our Frame

A comprehensive personal project that combines photography, family memories, and AI-powered features into one beautiful platform.

## 🎯 Project Vision

**Our Frame** is a modular website that combines:

1. **Personal Photography Portfolio** (artistic, travel, family)
2. **Smart Baby Journal** for newborn child with AI features
3. **Video and Voice Memory Archive**
4. **AI-powered tagging, captioning, storytelling, and voice-to-text**

## ✨ Features

### 🖼️ Photo Gallery & Management
- **Google Drive Integration**: Auto-sync photos from Google Drive
- **Beautiful Gallery**: Modern, responsive photo grid with smooth animations
- **Album Organization**: Organize photos by themes (artistic, travel, family)
- **AI-Powered Analysis**: Automatic tagging, captioning, and content analysis
- **Search & Filter**: Find photos by tags, dates, and themes

### 👶 Baby Journal
- **Photo Entries**: Link photos to journal entries with timestamps
- **Voice Recording**: Record and transcribe voice logs
- **AI Captions**: Automatic caption generation for baby moments
- **Milestone Tracking**: Track important developmental milestones
- **Story Generation**: AI-powered story creation from photo sequences

### 🎨 AI Features
- **LangChain Integration**: Advanced AI workflows for content analysis
- **Automatic Tagging**: Smart photo categorization
- **Caption Generation**: Creative and descriptive captions
- **Story Creation**: Generate heartwarming stories from photo sequences
- **Voice-to-Text**: Transcribe voice recordings for journal entries

### 🏗️ Technical Architecture
- **Modular Design**: Scalable, component-based architecture
- **Kubernetes Ready**: Containerized for easy deployment
- **Free-Tier Optimized**: Built to work with free-tier services
- **MCP Server Integration**: Anthropic's Model Context Protocol for AI orchestration

## 🚀 Current Implementation Status

### ✅ Phase 1: Complete
- **Backend API**: FastAPI with Google Drive integration
- **Frontend**: React + TypeScript with Vite
- **Photo Gallery**: Beautiful, responsive photo display
- **CORS Configuration**: Proper frontend-backend communication
- **Basic Navigation**: Multi-section application structure

### 🔄 Phase 2: In Progress
- **AI Integration**: LangChain setup for photo analysis
- **Enhanced Photo Management**: Album organization and filtering
- **Baby Journal Foundation**: Basic journal entry structure
- **API Expansion**: Additional endpoints for AI features

### 📋 Phase 3: Planned
- **Database Integration**: Supabase for data persistence
- **Voice Recording**: Audio capture and processing
- **Advanced AI Features**: Story generation and content analysis
- **User Authentication**: Secure access and user management

### 🎯 Phase 4: Future
- **Video Archive**: Video upload and processing
- **MCP Server**: Advanced AI workflow orchestration
- **Kubernetes Deployment**: Scalable container deployment
- **Advanced Features**: Memory timeline, intelligent organization

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Google Drive API**: Photo storage and sync
- **LangChain**: AI workflow orchestration
- **Pydantic**: Data validation and serialization

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Lucide React**: Beautiful icons
- **CSS3**: Modern styling with Grid and Flexbox

### AI & ML
- **OpenAI GPT**: Content generation and analysis
- **LangChain**: AI workflow management
- **Voice Processing**: Audio transcription and analysis

### Infrastructure
- **Docker**: Containerization
- **Kubernetes**: Scalable deployment
- **Supabase**: Database and authentication
- **MCP Server**: AI workflow orchestration

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Google Drive API credentials
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/knitinjaideep/our-frame.git
   cd our-frame
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `backend` directory:
   ```
   GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
   OPENAI_API_KEY=your_openai_api_key  # Optional
   ```

4. **Set up Google Drive API:**
   - Place your `client_secrets.json` file in the `backend` directory
   - Run the backend once to authenticate with Google Drive

5. **Start the application:**
   ```bash
   npm run dev
   ```
   This will start both the backend (port 8000) and frontend (port 3000)

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
our-frame/
├── backend/                 # FastAPI backend
│   ├── main.py             # API endpoints
│   ├── google_drive_client.py  # Google Drive integration
│   ├── requirements.txt    # Python dependencies
│   └── client_secrets.json # Google API credentials
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   └── App.css        # Application styles
│   └── package.json
├── langchain_toold/        # AI processing modules
│   └── ai_processor.py    # LangChain AI integration
├── supabase/              # Database configuration (future)
├── k8s/                   # Kubernetes deployment (future)
├── mcp/                   # MCP Server configuration (future)
└── package.json           # Root scripts
```

## 🔧 Development

### Individual Components

#### Backend (FastAPI)
- **Location:** `backend/`
- **Port:** 8000
- **Start:** `npm run dev:backend`

#### Frontend (React + Vite)
- **Location:** `frontend/`
- **Port:** 3000
- **Start:** `npm run dev:frontend`

### API Endpoints

- `GET /` - API health check
- `GET /photos/sync` - Fetch photos from Google Drive
- `GET /photos/albums` - Get available photo albums
- `GET /photos/albums/{album_id}` - Get photos for specific album
- `POST /ai/analyze` - Analyze photo with AI
- `POST /ai/baby-journal` - Generate baby journal entry
- `POST /ai/story` - Generate story from photos
- `GET /baby-journal/entries` - Get baby journal entries
- `GET /health` - Health check with AI status

## 🔐 Environment Variables

- `GOOGLE_DRIVE_FOLDER_ID` - The ID of your Google Drive folder containing images
- `OPENAI_API_KEY` - OpenAI API key for AI features (optional)

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to submit issues or pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Acknowledgments

- **Google Drive API** for photo storage and sync
- **OpenAI** for AI-powered features
- **LangChain** for AI workflow orchestration
- **React & Vite** for the beautiful frontend
- **FastAPI** for the robust backend
