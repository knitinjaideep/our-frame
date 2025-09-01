import { useState, useEffect } from "react"
import { Heart } from "lucide-react"

const dummyPhotos = [
  { id: 1, url: "/placeholder1.jpg", title: "Family Picnic" },
  { id: 2, url: "/placeholder2.jpg", title: "Baby's First Steps" },
  { id: 3, url: "/placeholder3.jpg", title: "Vacation Memories" },
  { id: 4, url: "/placeholder4.jpg", title: "Birthday Celebration" },
]

export default function Home() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const favoritePhotos = dummyPhotos.filter((p) => favoriteIds.includes(p.id))

  // Slideshow logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dummyPhotos.length)
    }, 3000) // slide every 3 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <section className="text-center py-16 px-6">
        <h1 className="text-5xl font-extrabold mb-4">Welcome to Our Family Hub</h1>
        <p className="text-xl opacity-90 mb-6">
          Cherish every moment. Your photos, videos, and memories in one place.
        </p>

        {/* Slideshow in Hero */}
        <div className="relative w-full max-w-3xl mx-auto h-64 md:h-96 rounded-xl overflow-hidden shadow-lg mt-8">
          <img
            src={dummyPhotos[currentSlide].url}
            alt={dummyPhotos[currentSlide].title}
            className="w-full h-full object-cover transition-transform duration-500"
          />
          <button
            onClick={() => toggleFavorite(dummyPhotos[currentSlide].id)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/70 hover:bg-white/90"
          >
            <Heart
              size={24}
              fill={favoriteIds.includes(dummyPhotos[currentSlide].id) ? "red" : "none"}
              stroke="red"
            />
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {dummyPhotos.map((_, index) => (
              <span
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlide ? "bg-red-500" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-xl hover:scale-105 transition-transform">
          <h3 className="text-xl font-bold mb-2">Photo Gallery</h3>
          <p className="opacity-90">Browse, search, and organize your family photos.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-xl hover:scale-105 transition-transform">
          <h3 className="text-xl font-bold mb-2">Albums</h3>
          <p className="opacity-90">Group photos by events, vacations, and special moments.</p>
        </div>
        <div className="bg-white/10 p-6 rounded-xl hover:scale-105 transition-transform">
          <h3 className="text-xl font-bold mb-2">Baby Journal</h3>
          <p className="opacity-90">Track milestones, notes, and firsts in one place.</p>
        </div>
      </section>

      {/* Favorites */}
      {favoritePhotos.length > 0 && (
        <section className="px-6 py-12 bg-white/10 rounded-t-3xl">
          <h2 className="text-3xl font-bold mb-6">Favorites ❤️</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {favoritePhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform"
              >
                <img src={photo.url} alt={photo.title} className="w-full h-48 object-cover" />
                <button
                  onClick={() => toggleFavorite(photo.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-white/70 hover:bg-white/90"
                >
                  <Heart size={20} fill="red" stroke="red" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 text-center opacity-80">
        © 2025 Our Family Hub ❤️ | All Memories Stored Safely
      </footer>
    </div>
  )
}
