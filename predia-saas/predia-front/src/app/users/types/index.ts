import type { components } from '@predia/api-types'

export type UserRole = 'super_admin' | 'admin' | 'agent'

// Defined manually — openapi-typescript infers nullable string fields as
// Record<string,never> which breaks intersections. Schema is used only for
// request types where inference is accurate.
export interface User {
  id: string
  tenant_id: string
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'agent'
  status: 'active' | 'suspended' | 'invited' | 'deactivated'
  suspended_at: string | null
  created_at: string
  updated_at: string
}
export type PaginatedUsers = components['schemas']['PageOfUserResponseDto']

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
    itemCount: number
    pageCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}
