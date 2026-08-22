import { redirect } from 'next/navigation'

// The onboarding wizard has been replaced by the in-app setup flow on /home.
// Any existing links or bookmarks to /onboarding are transparently redirected.
export default function OnboardingPage() {
  redirect('/home')
}
