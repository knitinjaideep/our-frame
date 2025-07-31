import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, RefreshCw, Image as ImageIcon, Album, Baby, Home, Heart } from 'lucide-react'
import './App.css'

interface Photo {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  thumbnailLink: string
  createdTime?: string
  modifiedTime?: string
  size?: string
}

interface Album {
  id: string
  name: string
  description?: string
  theme?: string
  photoCount: number
  coverPhoto?: string
  createdTime: string
}

interface BabyJournalEntry {
  id: string
  title: string
  date: string
  photoId?: string
  voiceRecording?: string
  aiCaption?: string
  milestone?: string
}

type AppSection = 'home' | 'gallery' | 'albums' | 'baby-journal'

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>('home')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [babyEntries, setBabyEntries] = useState<BabyJournalEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('http://localhost:8000/photos/sync')
      setPhotos(response.data)
    } catch (err) {
      setError('Failed to fetch photos. Please make sure the backend server is running.')
      console.error('Error fetching photos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbums = async () => {
    try {
      const response = await axios.get('http://localhost:8000/photos/albums')
      setAlbums(response.data)
    } catch (err) {
      console.error('Error fetching albums:', err)
    }
  }

  const fetchBabyJournal = async () => {
    try {
      const response = await axios.get('http://localhost:8000/baby-journal/entries')
      setBabyEntries(response.data)
    } catch (err) {
      console.error('Error fetching baby journal:', err)
    }
  }

  useEffect(() => {
    if (currentSection === 'gallery' || currentSection === 'home') {
      fetchPhotos()
    }
    if (currentSection === 'albums') {
      fetchAlbums()
    }
    if (currentSection === 'baby-journal') {
      fetchBabyJournal()
    }
  }, [currentSection])

  const handleRefresh = () => {
    if (currentSection === 'gallery' || currentSection === 'home') {
      fetchPhotos()
    }
  }

  const renderHome = () => (
    <div className="home-section">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Our Frame</h1>
          <p>Capture, organize, and cherish your precious moments</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{photos.length}</span>
              <span className="stat-label">Photos</span>
            </div>
            <div className="stat">
              <span className="stat-number">{albums.length}</span>
              <span className="stat-label">Albums</span>
            </div>
            <div className="stat">
              <span className="stat-number">{babyEntries.length}</span>
              <span className="stat-label">Memories</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="feature-grid">
        <div className="feature-card" onClick={() => setCurrentSection('gallery')}>
          <ImageIcon size={48} />
          <h3>Photo Gallery</h3>
          <p>View and organize your photos from Google Drive</p>
        </div>
        <div className="feature-card" onClick={() => setCurrentSection('albums')}>
          <Album size={48} />
          <h3>Albums</h3>
          <p>Organize photos by themes and categories</p>
        </div>
        <div className="feature-card" onClick={() => setCurrentSection('baby-journal')}>
          <Baby size={48} />
          <h3>Baby Journal</h3>
          <p>Track precious moments and milestones</p>
        </div>
      </div>
    </div>
  )

  const renderGallery = () => (
    <div className="gallery-section">
      <div className="section-header">
        <h2>Photo Gallery</h2>
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="refresh-button"
        >
          {loading ? <Loader2 size={20} className="spin" /> : <RefreshCw size={20} />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPhotos} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <Loader2 size={48} className="spin" />
          <p>Loading photos...</p>
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="empty-state">
          <ImageIcon size={64} />
          <h2>No photos found</h2>
          <p>Make sure your Google Drive folder contains images.</p>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <div className="photo-container">
                <img 
                  src={photo.thumbnailLink} 
                  alt={photo.name}
                  className="photo-image"
                  loading="lazy"
                />
                <div className="photo-overlay">
                  <a 
                    href={photo.webViewLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-button"
                  >
                    View Original
                  </a>
                </div>
              </div>
              <div className="photo-info">
                <h3 className="photo-name">{photo.name}</h3>
                <p className="photo-type">{photo.mimeType}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderAlbums = () => (
    <div className="albums-section">
      <div className="section-header">
        <h2>Photo Albums</h2>
      </div>
      
      <div className="albums-grid">
        {albums.map((album) => (
          <div key={album.id} className="album-card">
            <div className="album-icon">
              <Album size={48} />
            </div>
            <div className="album-info">
              <h3>{album.name}</h3>
              <p>{album.description}</p>
              <span className="album-count">{album.photoCount} photos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBabyJournal = () => (
    <div className="baby-journal-section">
      <div className="section-header">
        <h2>Baby Journal</h2>
        <button className="add-entry-button">
          <Heart size={20} />
          Add Entry
        </button>
      </div>
      
      <div className="journal-entries">
        {babyEntries.map((entry) => (
          <div key={entry.id} className="journal-entry">
            <div className="entry-header">
              <h3>{entry.title}</h3>
              <span className="entry-date">{entry.date}</span>
            </div>
            {entry.aiCaption && (
              <p className="entry-caption">{entry.aiCaption}</p>
            )}
            {entry.milestone && (
              <span className="milestone-badge">{entry.milestone}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'home':
        return renderHome()
      case 'gallery':
        return renderGallery()
      case 'albums':
        return renderAlbums()
      case 'baby-journal':
        return renderBabyJournal()
      default:
        return renderHome()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => setCurrentSection('home')}>
            <Heart size={32} />
            <h1>Our Frame</h1>
          </div>
          <nav className="navigation">
            <button 
              className={`nav-button ${currentSection === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentSection('home')}
            >
              <Home size={20} />
              Home
            </button>
            <button 
              className={`nav-button ${currentSection === 'gallery' ? 'active' : ''}`}
              onClick={() => setCurrentSection('gallery')}
            >
              <ImageIcon size={20} />
              Gallery
            </button>
            <button 
              className={`nav-button ${currentSection === 'albums' ? 'active' : ''}`}
              onClick={() => setCurrentSection('albums')}
            >
              <Album size={20} />
              Albums
            </button>
            <button 
              className={`nav-button ${currentSection === 'baby-journal' ? 'active' : ''}`}
              onClick={() => setCurrentSection('baby-journal')}
            >
              <Baby size={20} />
              Baby Journal
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
