import { createApiClient } from '@predia/api-types'
import { tokenStorage } from './tokens'
import { router } from '@/router'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// Deduplicates concurrent refresh calls — if three requests 401 at the same
// time, only one /auth/refresh is fired; all three await the same promise.
let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json() as { accessToken?: string }
      if (data.accessToken) {
        tokenStorage.setTokens(data.accessToken)
        return data.accessToken
      }
      return null
    })
    .catch(() => null)
    .finally(() => { refreshPromise = null })

  return refreshPromise
}

export const apiClient = createApiClient(BASE_URL)

apiClient.use({
  onRequest({ request }) {
    const token = tokenStorage.getAccessToken()
    const headers = new Headers(request.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return new Request(request, { credentials: 'include', headers })
  },

  async onResponse({ request, response }) {
    if (response.status !== 401) return response
    // Avoid refresh loop if the refresh endpoint itself returns 401
    if (new URL(request.url).pathname.endsWith('/auth/refresh')) return response

    const newToken = await refreshAccessToken()
    if (!newToken) {
      tokenStorage.clearTokens()
      void router.navigate({ to: '/login', replace: true })
      return response
    }

    // Retry original request with the new token
    const headers = new Headers(request.headers)
    headers.set('Authorization', `Bearer ${newToken}`)
    return fetch(new Request(request, { credentials: 'include', headers }))
  },
})
