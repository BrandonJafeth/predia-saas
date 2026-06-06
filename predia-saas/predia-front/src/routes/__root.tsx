import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import AppLayout from '@/layouts/AppLayout'

export const Route = createRootRoute({
  component: () => {
    const { pathname } = useLocation()
    const isLogin = pathname === '/login'

    return (
      <>
        {isLogin ? (
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
