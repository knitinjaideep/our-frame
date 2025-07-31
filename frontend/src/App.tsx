import { useState, useEffect } from 'react'
import axios from 'axios'
import { Loader2, RefreshCw, Image as ImageIcon } from 'lucide-react'
import './App.css'

interface Photo {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  thumbnailLink: string
}

function App() {
  const [photos, setPhotos] = useState<Photo[]>([])
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

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleRefresh = () => {
    fetchPhotos()
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <ImageIcon size={32} />
            <h1>Photo Gallery</h1>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="refresh-button"
          >
            {loading ? <Loader2 size={20} className="spin" /> : <RefreshCw size={20} />}
            Refresh
          </button>
        </div>
      </header>

      <main className="main">
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
      </main>
    </div>
  )
}

export default App
