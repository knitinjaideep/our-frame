import { Image as ImageIcon, Album, Baby, Home, Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { AppSection } from '../types'

const tabs: Array<{ id: AppSection; label: string; icon: any }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'gallery', label: 'Gallery', icon: ImageIcon },
  { id: 'albums', label: 'Albums', icon: Album },
  { id: 'baby-journal', label: 'Baby Journal', icon: Baby },
]

export function NavBar() {
  const { current, setCurrent } = useApp()
  return (
    <header className="header">
      <div className="header-content">
        <button onClick={() => setCurrent('home')} className="logo">
          <Heart size={25} className="opacity-70" fill="red" stroke="red" />
          <span className="text-lg font-semibold">Our Frame</span>
        </button>

        <nav className="flex items-center gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrent(id)}
              className={`nav-button ${current === id ? 'active' : ''}`}
              aria-current={current === id ? 'page' : undefined}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
