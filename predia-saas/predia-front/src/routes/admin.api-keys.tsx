import { createFileRoute, redirect } from '@tanstack/react-router'
import ApiKeysPage from '@/app/api-keys/components/ApiKeysPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/admin/api-keys')({
  beforeLoad: () => {
    const payload = tokenStorage.decodeAccessToken()
    if (payload?.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <ApiKeysPage scope="portal" />,
})
