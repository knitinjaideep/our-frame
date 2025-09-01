import { createContext, useContext, useState, ReactNode } from 'react'
import type { AppSection } from '../types'

type Ctx = {
  current: AppSection
  setCurrent: (s: AppSection) => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<AppSection>('home')
  return (
    <AppContext.Provider value={{ current, setCurrent }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
