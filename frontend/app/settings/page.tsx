import { Metadata } from 'next'
import { SettingsView } from '@/components/settings/settings-view'

export const metadata: Metadata = {
  title: 'Settings — Our Frame',
}

export default function SettingsPage() {
  return <SettingsView />
}
