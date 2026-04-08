'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function VideosHighlightsPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.milestones ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="The Big Days"
      heading="Highlights"
      description="Milestones, celebrations, the moments that anchor us."
      emptyMessage="No highlight albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
