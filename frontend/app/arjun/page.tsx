'use client'
import { useSections } from '@/hooks/use-sections'
import { SectionWorldPage } from '@/components/sections/section-world-page'

export default function ArjunPage() {
  const { data, isLoading, error } = useSections()

  return (
    <SectionWorldPage
      albums={data?.featured_child ?? []}
      isLoading={isLoading}
      error={error}
      eyebrow="Growing Up, Frame by Frame"
      heading="Arjun"
      description="Every milestone, every laugh. A chapter written in light."
      emptyMessage="No Arjun albums found. Map a Google Drive folder to this section in Settings."
      accentColor="amber"
    />
  )
}
