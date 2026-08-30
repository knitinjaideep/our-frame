import { redirect } from 'next/navigation'
import { BUCKETS } from '@/lib/buckets'

// See app/arjun/page.tsx — same reasoning, Travel chapter.
export default function TravelRedirect() {
  redirect(`/albums/${BUCKETS[1].id}`)
}
