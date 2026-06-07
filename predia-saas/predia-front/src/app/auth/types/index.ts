import type { components } from '@predia/api-types'

export type RegisterRequest = components['schemas']['RegisterDto']
export type AuthResponse = components['schemas']['AuthResponseDto']

// LoginDto fue cambiado en el backend (tenantSlug → tenantId).
// Regenerar OpenAPI types con: pnpm run generate:openapi (en predia-api)
export interface LoginRequest {
  email: string
  password: string
  tenantId: string
}

export interface LookupRequest {
  email: string
}

export interface TenantOption {
  id: string
  name: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}
