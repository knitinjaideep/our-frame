'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeFolderStructure } from '@/lib/platform-api'
import type { FolderStructureRecommendation } from '@/lib/platform-api'
import { Loader2, CheckCircle2, Sparkles, Sliders } from 'lucide-react'

interface Props {
  workspaceId: number
  folderId: string
  folderName: string
  onNext: (template: string, recommendationId: string) => void
  onBack: () => void
}

function RecommendationCard({
  rec,
  selected,
  isTop,
  onSelect,
}: {
  rec: FolderStructureRecommendation
  selected: boolean
  isTop: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      layout
      onClick={onSelect}
      className="w-full text-left rounded-xl px-4 py-4 transition-all duration-200"
      style={{
        background: selected ? 'var(--amber-subtle)' : 'var(--card)',
        border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 3px var(--amber-subtle)' : 'none',
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: selected ? 'var(--amber-muted)' : 'var(--muted)',
            color: selected ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
        >
          {rec.id === 'custom' ? <Sliders className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        </span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground">{rec.title}</p>
            {isTop && rec.id !== 'custom' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-1"
                style={{ background: 'var(--amber-muted)', color: 'var(--primary)' }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Recommended
              </span>
            )}
            {selected && (
              <CheckCircle2 className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--primary)' }} />
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{rec.description}</p>

          {/* Reasoning — why it was suggested */}
          {rec.reasoning && rec.id !== 'custom' && (
            <p
              className="text-[11px] leading-relaxed px-2.5 py-1.5 rounded-lg"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                fontStyle: 'italic',
              }}
            >
              {rec.reasoning}
            </p>
          )}

          {/* Preview lines */}
          {rec.preview.length > 0 && selected && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                {rec.preview.map((line, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span style={{ color: 'var(--primary)' }}>→</span>
                    {line}
                  </p>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.button>
  )
}

export function StepFolderStructure({ workspaceId, folderId, folderName, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['folderAnalysis', workspaceId, folderId],
    queryFn: () => analyzeFolderStructure(workspaceId, folderId),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const recommendations = data?.recommendations ?? []
  const selectedRec = recommendations.find((r) => r.id === selected)

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--primary)' }}>
          Step 5b of 6
        </p>
        <h2 className="font-serif text-3xl text-foreground">How is it organised?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We analysed <strong className="text-foreground">{folderName}</strong> and found{' '}
          {data ? (
            <span>{data.subfolder_count} subfolder{data.subfolder_count !== 1 ? 's' : ''}.</span>
          ) : (
            'your folders.'
          )}{' '}
          Choose the pattern that best describes your structure.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
          <p className="text-sm text-muted-foreground">Analysing your folder structure…</p>
        </div>
      )}

      {isError && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ background: 'oklch(from var(--destructive) l c h / 10%)', color: 'var(--destructive)' }}
        >
          Couldn't analyse the folder. You can still choose a structure manually below.
        </div>
      )}

      {/* Subfolders found */}
      {data && data.subfolders_sampled.length > 0 && (
        <div
          className="px-3.5 py-2.5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Subfolders found
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {data.subfolders_sampled.slice(0, 12).join(' · ')}
            {data.subfolders_sampled.length > 12 && <span className="opacity-60"> and more</span>}
          </p>
        </div>
      )}

      {/* Recommendation cards */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              selected={selected === rec.id}
              isTop={i === 0}
              onSelect={() => setSelected(rec.id)}
            />
          ))}
        </div>
      )}

      {/* Fallback if no recommendations */}
      {!isLoading && recommendations.length === 0 && !isError && (
        <div className="py-8 text-center space-y-2">
          <p className="text-muted-foreground text-sm">No subfolders found to analyse.</p>
          <button
            onClick={() => onNext('custom', 'custom')}
            className="text-sm underline"
            style={{ color: 'var(--primary)' }}
          >
            Use custom structure
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2.5">
        <button
          onClick={() => selectedRec && onNext(selectedRec.template, selectedRec.id)}
          disabled={!selected}
          className="w-full px-6 py-3.5 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          {selectedRec ? `Use ${selectedRec.title}` : 'Choose a structure above'}
        </button>
        <button
          onClick={onBack}
          className="w-full px-6 py-3 rounded-xl text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to folder selection
        </button>
      </div>
    </div>
  )
}
