'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function MilestonesPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.milestones ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="Anchor Memories"
      heading="Milestones"
      description="The days that changed everything. Engagements, weddings, birthdays — held forever."
      emptyMessage="No milestone albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
