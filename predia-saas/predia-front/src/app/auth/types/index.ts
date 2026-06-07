import type { components } from '@predia/api-types'

export type RegisterRequest = components['schemas']['RegisterDto']
export type AuthResponse = components['schemas']['AuthResponseDto']
export type LoginRequest = components['schemas']['LoginDto']
export type LookupRequest = components['schemas']['LookupDto']
export type TenantOption = components['schemas']['TenantOptionDto']

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}
