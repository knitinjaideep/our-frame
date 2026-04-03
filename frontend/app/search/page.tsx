import { Search } from 'lucide-react'

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 lg:px-14">
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--amber-muted)' }}
        >
          <Search className="h-7 w-7" style={{ color: 'var(--amber)' }} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search</h1>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          Metadata and keyword search coming soon. Semantic AI-powered discovery in a future release.
        </p>
      </div>
    </div>
  )
}
