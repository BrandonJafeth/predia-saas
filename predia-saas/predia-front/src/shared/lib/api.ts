import { createApiClient } from '@predia/api-types'
import { tokenStorage } from './tokens'

export const apiClient = createApiClient(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
)

apiClient.use({
  onRequest({ request }) {
    const token = tokenStorage.getAccessToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
    return request
  },
})
