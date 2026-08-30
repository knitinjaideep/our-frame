import { redirect } from 'next/navigation'
import { BUCKETS } from '@/lib/buckets'

// See app/arjun/page.tsx — same reasoning, Milestones chapter.
export default function MilestonesRedirect() {
  redirect(`/albums/${BUCKETS[2].id}`)
}
