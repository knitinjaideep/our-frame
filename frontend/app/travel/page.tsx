'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function TravelPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.travel ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="Stories From Everywhere"
      heading="Family Travel"
      description="Roads taken, cities explored, memories carried home."
      emptyMessage="No travel albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
