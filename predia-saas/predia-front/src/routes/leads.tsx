import { createFileRoute, redirect } from '@tanstack/react-router'
import TenantLeadsPage from '@/app/leads/components/TenantLeadsPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/leads')({
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    if (role !== 'admin' && role !== 'agent') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: TenantLeadsPage,
})
