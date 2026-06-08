import { createFileRoute, redirect } from '@tanstack/react-router'
import AuditLogPage from '@/app/admin/components/AuditLogPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/admin/audit-log')({
  beforeLoad: () => {
    const payload = tokenStorage.decodeAccessToken()
    if (payload?.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AuditLogPage,
})
