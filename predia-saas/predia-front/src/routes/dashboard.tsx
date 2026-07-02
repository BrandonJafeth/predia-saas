import { createFileRoute } from '@tanstack/react-router'
import { tokenStorage } from '@/shared/lib/tokens'
import DashboardPage from '@/app/dashboard/components/DashboardPage'
import AdminDashboardPage from '@/app/admin/components/AdminDashboardPage'

function DashboardRoute() {
  const role = tokenStorage.decodeAccessToken()?.role
  return role === 'super_admin' ? <AdminDashboardPage /> : <DashboardPage />
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardRoute,
})
