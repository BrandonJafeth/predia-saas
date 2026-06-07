export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled'

export interface Tenant {
  id: string
  name: string
  slug: string
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
}

export interface CreateTenantRequest {
  name: string
  slug: string
}

export interface UpdateTenantRequest {
  name?: string
  slug?: string
}

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

export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
}
