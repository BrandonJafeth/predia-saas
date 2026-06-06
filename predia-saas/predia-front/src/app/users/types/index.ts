import type { components } from '@predia/api-types'

export type UserRole = 'super_admin' | 'admin' | 'agent'

// Tipos de response derivados del schema OpenAPI generado
export type User = components['schemas']['UserResponseDto']
export type PaginatedUsers = components['schemas']['PageOfDto']

// Tipos de request derivados del schema OpenAPI generado
export type CreateUserRequest = components['schemas']['CreateUserDto']

// UpdateUserDto del schema tiene role sin '?' por un bug de openapi-typescript
// cuando el schema JSON no tiene 'required'. Lo redeclaramos como Partial:
export type UpdateUserRequest = Partial<components['schemas']['UpdateUserDto']>

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}
