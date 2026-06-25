import { createFileRoute, redirect } from '@tanstack/react-router'
import CategoriesAdminPage from '@/app/admin/components/CategoriesAdminPage'
import { tokenStorage } from '@/shared/lib/tokens'

export const Route = createFileRoute('/admin/categories')({
  beforeLoad: () => {
    const payload = tokenStorage.decodeAccessToken()
    if (payload?.role !== 'super_admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: CategoriesAdminPage,
})
