import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import ErrorPage from '@/app/errors/ErrorPage'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ErrorPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
