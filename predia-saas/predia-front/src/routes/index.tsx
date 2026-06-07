import { createFileRoute, redirect } from '@tanstack/react-router'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    throw redirect({ to: role === 'super_admin' ? '/admin/tenants' : '/dashboard' })
  },
})
