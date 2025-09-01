import { SectionShell } from '../../components/SectionTabs'
import type { BabyJournalEntry } from '../../types'

const entries: BabyJournalEntry[] = [
  { id: 'b1', title: 'First Smile', date: '2024-06-01', aiCaption: 'Sunshine grin!' },
  { id: 'b2', title: 'First Steps', date: '2024-09-14', milestone: 'Walking!' },
]

export default function BabyJournal() {
  return (
    <SectionShell>
      <h2 className="mb-4 text-xl font-semibold text-white">Baby Journal</h2>
      <div className="space-y-3">
        {entries.map((e) => (
          <div key={e.id} className="rounded-2xl border p-4 bg-white/90">
            <p className="font-medium text-slate-900">{e.title}</p>
            <p className="text-xs text-muted-foreground">{new Date(e.date).toDateString()}</p>
            {e.aiCaption && <p className="mt-2 text-sm text-slate-800">{e.aiCaption}</p>}
            {e.milestone && <p className="mt-2 text-sm text-slate-800">Milestone: {e.milestone}</p>}
          </div>
        ))}
      </div>
    </SectionShell>
  )
}
