import { createFileRoute, redirect } from '@tanstack/react-router'
import TenantAuditLogPage from '@/app/audit-log/components/TenantAuditLogPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/audit-log')({
  beforeLoad: () => {
    const payload = tokenStorage.decodeAccessToken()
    if (payload?.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: TenantAuditLogPage,
})
