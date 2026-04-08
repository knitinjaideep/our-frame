'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function VideosFamilyPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.life ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="Everyday Life"
      heading="Family Moments"
      description="The in-between moments. The ones we almost missed."
      emptyMessage="No family moment albums found. Map a Google Drive folder to this section in Settings."
      accentColor="muted"
    />
  )
}
