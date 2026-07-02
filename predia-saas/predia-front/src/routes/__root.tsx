import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import AppLayout from '@/layouts/AppLayout'
import { tokenStorage } from '@/shared/lib/tokens'
import { refreshAccessToken } from '@/shared/lib/api'
import { Toaster, TOASTER_OPTIONS } from '@/shared/lib/notifications'
import NotFoundPage from '@/app/errors/NotFoundPage'

const AUTH_PATHS = ['/login', '/forgot-password']
const PUBLIC_PATHS = ['/reset-password']

let sessionRestored = false

function RootComponent() {
  const { pathname } = useLocation()
  const isAuthPage = AUTH_PATHS.includes(pathname) || PUBLIC_PATHS.includes(pathname)

  return (
    <>
      {isAuthPage ? (
        <div key={pathname} className="animate-fade-in">
          <Outlet />
        </div>
      ) : (
        <AppLayout>
          <Outlet />
        </AppLayout>
      )}
      <Toaster position="top-right" options={TOASTER_OPTIONS} />
    </>
  )
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (!sessionRestored) {
      sessionRestored = true
      if (!tokenStorage.getAccessToken()) {
        await refreshAccessToken()
      }
    }

    const token = tokenStorage.getAccessToken()
    const isAuthPath = AUTH_PATHS.includes(location.pathname)
    const isPublicPath = PUBLIC_PATHS.includes(location.pathname)

    if (isAuthPath && token) {
      const role = tokenStorage.decodeAccessToken()?.role
      throw redirect({ to: role === 'super_admin' ? '/admin/tenants' : '/dashboard' })
    }
    if (!isAuthPath && !isPublicPath && !token) {
      throw redirect({ to: '/login' })
    }
  },

  component: RootComponent,
  notFoundComponent: NotFoundPage,
})
