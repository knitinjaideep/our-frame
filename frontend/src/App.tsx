import { useMemo } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import type { AppSection } from './types'
import { NavBar } from './components/NavBar'
import Home from './features/home/Home'
import Gallery from './features/gallery/Gallery'
import Albums from './features/albums/Albums'
import BabyJournal from './features/baby-journal/BabyJournal'

function SectionRouter() {
  const { current } = useApp()
  const view = useMemo(() => {
    const map: Record<AppSection, JSX.Element> = {
      home: <Home />,
      gallery: <Gallery />,
      albums: <Albums />,
      'baby-journal': <BabyJournal />,
    }
    return map[current]
  }, [current])
  return <>{view}</>
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-shell text-foreground">
        <NavBar />
        <main className="main">
          <div className="page-pad">
            <SectionRouter />
          </div>
        </main>
      </div>
    </AppProvider>
  )
}
