import { createApiClient } from '@predia/api-types'
import { tokenStorage } from './tokens'

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

// A Request's body stream can only be read once. By the time onResponse runs,
// the real fetch has already consumed it — reconstructing a retry `new
// Request(request, ...)` straight from that spent object throws "Request
// object that has already been used" for any body-bearing call (PATCH/POST).
// Only surfaces once the access token expires (401 → retry), so it hid until
// a body request happened to land after the 15min token lifetime. Fix: stash
// an unconsumed clone the moment the request is built, before fetch touches it.
const pristineClones = new WeakMap<Request, Request>()

apiClient.use({
  onRequest({ request }) {
    const token = tokenStorage.getAccessToken()
    const headers = new Headers(request.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const authedRequest = new Request(request, { credentials: 'include', headers })
    pristineClones.set(authedRequest, authedRequest.clone())
    return authedRequest
  },

  async onResponse({ request, response }) {
    if (response.status !== 401) return response
    // Avoid refresh loop if the refresh endpoint itself returns 401
    if (new URL(request.url).pathname.endsWith('/auth/refresh')) return response

    const newToken = await refreshAccessToken()
    if (!newToken) {
      tokenStorage.clearTokens()
      // Lazy import breaks the circular dependency: api → router → services → api
      const { router } = await import('@/router')
      void router.navigate({ to: '/login', replace: true })
      return response
    }

    // Retry original request with the new token, from the untouched clone —
    // `request` itself is already spent (its body was sent over the wire).
    const pristine = pristineClones.get(request) ?? request
    const headers = new Headers(pristine.headers)
    headers.set('Authorization', `Bearer ${newToken}`)
    return fetch(new Request(pristine, { credentials: 'include', headers }))
  },
})
