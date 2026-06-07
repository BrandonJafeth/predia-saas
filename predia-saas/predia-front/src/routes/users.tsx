import { createFileRoute, redirect } from '@tanstack/react-router'
import TenantUsersPage from '@/app/users/components/TenantUsersPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/users')({
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    if (role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: TenantUsersPage,
})
