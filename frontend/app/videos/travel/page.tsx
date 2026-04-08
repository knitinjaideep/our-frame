'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function VideosTravelPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.travel ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="On the Road"
      heading="Travel Films"
      description="Places we have been. Moments that moved us."
      emptyMessage="No travel video albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
