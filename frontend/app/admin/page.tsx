import { Metadata } from 'next'
import { AdminView } from '@/components/admin/admin-view'

export const metadata: Metadata = {
  title: 'Admin — Our Frame',
}

export default function AdminPage() {
  return <AdminView />
}
