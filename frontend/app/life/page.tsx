'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function LifePage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.life ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="People & Moments"
      heading="Life"
      description="Friends, family, ordinary days. Everything that makes us us."
      emptyMessage="No life albums found. Map a Google Drive folder to this section in Settings."
      accentColor="muted"
    />
  )
}
