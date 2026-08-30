'use client'
import { use } from 'react'
import { useAlbumDetail } from '@/hooks/use-albums'
import { AlbumDetailTemplate, type AlbumDetailTemplateMeta } from '@/components/photos/album-detail-template'
import { BUCKETS } from '@/lib/buckets'

// The nav's Photos dropdown links each chapter straight to its Drive folder
// id (see components/layout/top-nav.tsx PHOTOS_ITEMS). Every id — chapter
// bucket or real leaf album/sub-album nested under one — renders through
// the same `AlbumDetailTemplate` (docs/redesign-v2 PR 2); only the eyebrow/
// description/empty-state copy differs per chapter, sourced from
// `lib/buckets.ts` rather than four separate page components.
// The four top-level chapter buckets are category *landing* pages (Home →
// Photos → Arjun/Travel/Milestones/Life), not individual albums — flagged
// `isCategory: true` so `AlbumDetailTemplate` renders the compact
// `CategoryHeader` and the 3/2/1-column category folder grid (docs/
// redesign-v2/PROMPTS.md PR 5) instead of the leaf-album `AlbumHeader` and
// 4/3/2 grid. Any other id (a real album/sub-album id) falls through to
// `BUCKET_META[id] === undefined`, i.e. the existing leaf-album treatment.
const BUCKET_META: Record<string, AlbumDetailTemplateMeta> = {
  [BUCKETS[0].id]: {
    eyebrow: BUCKETS[0].eyebrow,
    description: BUCKETS[0].description,
    emptyMessage: 'No Arjun photos or albums found yet. Map a Google Drive folder to this section in Settings.',
    // Arjun is the one chapter that holds dated photos directly; keep the
    // age captions the removed `arjun-gallery.tsx` used to render.
    ageCaptions: true,
    isCategory: true,
  },
  [BUCKETS[1].id]: {
    eyebrow: BUCKETS[1].eyebrow,
    description: BUCKETS[1].description,
    emptyMessage: 'No travel albums found yet. Map a Google Drive folder to this section in Settings.',
    isCategory: true,
  },
  [BUCKETS[2].id]: {
    eyebrow: BUCKETS[2].eyebrow,
    description: BUCKETS[2].description,
    emptyMessage: 'No milestone albums found yet. Map a Google Drive folder to this section in Settings.',
    isCategory: true,
  },
  [BUCKETS[3].id]: {
    eyebrow: BUCKETS[3].eyebrow,
    description: BUCKETS[3].description,
    emptyMessage: 'No life albums found yet. Map a Google Drive folder to this section in Settings.',
    isCategory: true,
  },
}

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, isLoading, error } = useAlbumDetail(id)

  return <AlbumDetailTemplate id={id} data={data} isLoading={isLoading} error={error} meta={BUCKET_META[id]} />
}
