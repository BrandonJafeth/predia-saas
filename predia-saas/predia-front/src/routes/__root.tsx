import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import AppLayout from '@/layouts/AppLayout'
import { tokenStorage } from '@/shared/lib/tokens'

const AUTH_PATHS = ['/login']

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    const token = tokenStorage.getAccessToken()
    const isAuthPath = AUTH_PATHS.includes(location.pathname)

    if (isAuthPath && token) {
      throw redirect({ to: '/dashboard' })
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
