import { createFileRoute, redirect } from '@tanstack/react-router'
import TenantDetailPage from '@/app/admin/components/TenantDetailPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/admin/tenants/$id')({
  beforeLoad: () => {
    if (tokenStorage.decodeAccessToken()?.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: function TenantDetailRoute() {
    const { id } = Route.useParams()
    return <TenantDetailPage tenantId={id} />
  },
})
