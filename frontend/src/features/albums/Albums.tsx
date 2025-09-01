import type { Album } from '../../types'
import { SectionShell } from '../../components/SectionTabs'

const mock: Album[] = [
  { id: 'a1', name: 'Family', description: 'Cozy moments', theme: 'warm', photoCount: 128, coverPhoto: '', createdTime: new Date().toISOString() },
  { id: 'a2', name: 'Travel', description: 'Wander shots', theme: 'cool', photoCount: 342, coverPhoto: '', createdTime: new Date().toISOString() },
]

export default function Albums() {
  return (
    <SectionShell>
      <h2 className="mb-4 text-xl font-semibold text-white">Albums</h2>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {mock.map((a) => (
          <div key={a.id} className="rounded-2xl border p-4 bg-white/90">
            <div className="aspect-[16/9] rounded-xl bg-muted/50" />
            <div className="mt-3">
              <p className="font-medium text-slate-900">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.photoCount} photos</p>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
