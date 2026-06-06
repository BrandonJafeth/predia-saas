import type { components } from '@predia/api-types'

// Tipos derivados del schema OpenAPI generado
export type LoginRequest = components['schemas']['LoginDto']
export type RegisterRequest = components['schemas']['RegisterDto']
export type AuthResponse = components['schemas']['AuthResponseDto']

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}
