import { createFileRoute, redirect } from '@tanstack/react-router'
import UsersAdminPage from '@/app/admin/components/UsersAdminPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: () => {
    const payload = tokenStorage.decodeAccessToken()
    if (payload?.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: UsersAdminPage,
})
