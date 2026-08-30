import { redirect } from 'next/navigation'
import { BUCKETS } from '@/lib/buckets'

// `/arjun` predates the current Photos IA (Home → Photos → Category →
// Album). The canonical route for this chapter is `/albums/{bucketId}`
// (what the top-nav Photos dropdown links to, and what
// `AlbumDetailTemplate` renders — docs/redesign-v2 PR 2). Redirect rather
// than delete, so any existing link/bookmark to `/arjun` keeps working,
// without maintaining a second, divergent implementation of the same page.
export default function ArjunRedirect() {
  redirect(`/albums/${BUCKETS[0].id}`)
}
