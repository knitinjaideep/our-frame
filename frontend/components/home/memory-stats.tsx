import { Images, FolderOpen, Heart, Calendar } from 'lucide-react'
import type { MemoryStats } from '@/types'

export function MemoryStats({ stats }: { stats: MemoryStats }) {
  const yearsLabel =
    stats.oldest_year && stats.newest_year
      ? `${stats.newest_year - stats.oldest_year}+ yrs`
      : '—'

  const items = [
    { icon: Images,      value: stats.total_photos.toLocaleString(), label: 'Memories' },
    { icon: FolderOpen,  value: stats.total_albums.toLocaleString(),  label: 'Albums' },
    { icon: Heart,       value: stats.total_favorites.toLocaleString(), label: 'Favorites' },
    { icon: Calendar,    value: yearsLabel,                           label: 'Of History' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-5 shadow-warm transition-all duration-200 hover:shadow-warm-hover hover:-translate-y-0.5"
        >
          {/* Icon in amber muted circle */}
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200"
            style={{ backgroundColor: 'var(--amber-muted)' }}
          >
            <Icon className="h-4 w-4" style={{ color: 'var(--amber)' }} />
          </div>
          <p className="text-2xl font-bold text-card-foreground tabular-nums leading-none">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}
