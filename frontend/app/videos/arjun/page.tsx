'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function VideosArjunPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.featured_child ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="Growing Up"
      heading="Arjun Films"
      description="Every laugh, every first. His story in motion."
      emptyMessage="No Arjun video albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
