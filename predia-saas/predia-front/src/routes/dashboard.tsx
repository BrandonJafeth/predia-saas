import { createFileRoute, redirect } from '@tanstack/react-router'
import DashboardPage from '@/app/dashboard/components/DashboardPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    if (tokenStorage.decodeAccessToken()?.role === 'super_admin') {
      throw redirect({ to: '/admin/tenants' })
    }
  },
  component: DashboardPage,
})
