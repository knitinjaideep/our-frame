import { Images, FolderOpen, Heart, Calendar } from 'lucide-react'
import type { MemoryStats } from '@/types'

export function MemoryStrip({ stats }: { stats: MemoryStats }) {
  const yearsLabel =
    stats.oldest_year && stats.newest_year
      ? `${stats.newest_year - stats.oldest_year}+ yrs`
      : '—'

  const items = [
    { icon: Images,     value: stats.total_photos.toLocaleString(),    label: 'Memories' },
    { icon: FolderOpen, value: stats.total_albums.toLocaleString(),     label: 'Albums' },
    { icon: Heart,      value: stats.total_favorites.toLocaleString(),  label: 'Favorites' },
    { icon: Calendar,   value: yearsLabel,                              label: 'Of History' },
  ]

  return (
    <div className="flex items-center divide-x divide-border rounded-2xl border border-border bg-card shadow-warm overflow-hidden">
      {items.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="flex flex-1 flex-col items-center gap-1 px-4 py-4 text-center"
        >
          <Icon className="h-3.5 w-3.5 mb-0.5" style={{ color: 'var(--amber)' }} />
          <p className="text-lg font-bold tabular-nums leading-none text-card-foreground">
            {value}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
