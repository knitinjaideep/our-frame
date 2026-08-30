import { redirect } from 'next/navigation'
import { BUCKETS } from '@/lib/buckets'

// See app/arjun/page.tsx — same reasoning, Life chapter. `/photography`
// already redirected here before this PR; it now chains through to the
// canonical `/albums/{bucketId}` route as well.
export default function LifeRedirect() {
  redirect(`/albums/${BUCKETS[3].id}`)
}
