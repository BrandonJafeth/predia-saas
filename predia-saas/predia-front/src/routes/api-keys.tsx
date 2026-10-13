import { createFileRoute, redirect } from '@tanstack/react-router'
import ApiKeysPage from '@/app/api-keys/components/ApiKeysPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/api-keys')({
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    if (role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <ApiKeysPage scope="tenant" />,
})
