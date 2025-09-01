export default function Home() {
    return (
      <div className="text-white">
        <section className="hero">
          <h1>Our Frame</h1>
          <p>Capture, organize, and cherish your precious moments</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">—</span>
              <span className="stat-label">Photos</span>
            </div>
            <div className="stat">
              <span className="stat-number">—</span>
              <span className="stat-label">Folders</span>
            </div>
            <div className="stat">
              <span className="stat-number">—</span>
              <span className="stat-label">Memories</span>
            </div>
          </div>
        </section>
  
        <div className="feature-grid">
          <div className="feature-card">
            <h3 className="text-lg font-bold">Photo Gallery</h3>
            <p className="opacity-90">View and organize your photos from Google Drive</p>
          </div>
          <div className="feature-card">
            <h3 className="text-lg font-bold">Albums</h3>
            <p className="opacity-90">Organize photos by themes and categories</p>
          </div>
          <div className="feature-card">
            <h3 className="text-lg font-bold">Baby Journal</h3>
            <p className="opacity-90">Track precious moments and milestones</p>
          </div>
        </div>
      </div>
    )
  }
  