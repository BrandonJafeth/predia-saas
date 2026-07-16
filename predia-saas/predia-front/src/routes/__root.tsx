import { createRootRoute, Outlet, redirect, useLocation } from '@tanstack/react-router'
import AppLayout from '@/layouts/AppLayout'
import { tokenStorage } from '@/shared/lib/tokens'
import { refreshAccessToken } from '@/shared/lib/api'
import { Toaster, TOASTER_OPTIONS } from '@/shared/lib/notifications'
import NotFoundPage from '@/app/errors/NotFoundPage'

const AUTH_PATHS = ['/login', '/forgot-password']
const PUBLIC_PATHS = ['/reset-password']

// Shared across all beforeLoad invocations (incl. concurrent ones under
// StrictMode) so every caller awaits the *same* restoration attempt instead
// of racing past it — otherwise a second invocation could see the token as
// still null and redirect to /login before the first refresh resolves.
let sessionRestorePromise: Promise<void> | null = null

function restoreSession() {
  if (!sessionRestorePromise) {
    sessionRestorePromise = (async () => {
      if (!tokenStorage.getAccessToken()) {
        await refreshAccessToken()
      }
    })()
  }
  return sessionRestorePromise
}

// Full-screen loading shown while beforeLoad resolves (session restoration).
// This prevents the login card from flashing on protected routes.
function RootPending() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-welcome-in">
        <img src="/isotipoClaro.png" alt="Predia" className="h-14 w-14 object-contain" />
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ink-muted/40 animate-dot-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

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
    await restoreSession()

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

  // Show immediately (0ms delay) so the pending screen covers the entire
  // duration of the async beforeLoad — no login card flash.
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: RootPending,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
})
