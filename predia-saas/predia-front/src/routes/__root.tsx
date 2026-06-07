import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import AppLayout from '@/layouts/AppLayout'
import { tokenStorage } from '@/shared/lib/tokens'
import { refreshAccessToken } from '@/shared/lib/api'

const AUTH_PATHS = ['/login', '/forgot-password']

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

    if (isAuthPath && token) {
      const role = tokenStorage.decodeAccessToken()?.role
      throw redirect({ to: role === 'super_admin' ? '/admin/tenants' : '/dashboard' })
    }
    if (!isAuthPath && !token) {
      throw redirect({ to: '/login' })
    }
  },

  component: () => {
    const { pathname } = useLocation()
    const isAuthPage = AUTH_PATHS.includes(pathname)

    return (
      <>
        {isAuthPage ? (
          <Outlet />
        ) : (
          <AppLayout>
            <Outlet />
          </AppLayout>
        )}
        {import.meta.env.DEV && <TanStackRouterDevtools />}
      </>
    )
  },
})
