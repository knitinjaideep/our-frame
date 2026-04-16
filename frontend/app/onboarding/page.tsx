import { Metadata } from 'next'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'

export const metadata: Metadata = {
  title: 'Set Up Your Space — Our Frame',
  description: 'Create your family photo workspace.',
}

export default function OnboardingPage() {
  return <OnboardingFlow />
}
