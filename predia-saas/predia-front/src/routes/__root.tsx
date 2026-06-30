import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import AppLayout from '@/layouts/AppLayout'
import { tokenStorage } from '@/shared/lib/tokens'
import { refreshAccessToken } from '@/shared/lib/api'
import { Toaster, TOASTER_OPTIONS } from '@/shared/lib/notifications'

// Authenticated users get redirected away from these paths
const AUTH_PATHS = ['/login', '/forgot-password']
// Accessible to everyone — no redirect regardless of auth state
const PUBLIC_PATHS = ['/reset-password']

// Tracks whether we've already attempted session restoration this page load.
// Prevents re-calling /auth/refresh on every navigation.
let sessionRestored = false

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (!sessionRestored) {
      sessionRestored = true
      // Token lives in memory — empty on every page reload.
      // Try to restore it from the HttpOnly refresh cookie silently.
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

  component: () => {
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
  },
})
