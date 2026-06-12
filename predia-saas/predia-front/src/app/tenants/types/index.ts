import type { components } from '@predia/api-types'

export type Tenant = components['schemas']['TenantResponseDto']
export type SubscriptionStatus = Tenant['subscription_status']

export interface CreateTenantRequest {
  name: string
  slug: string
  advisor_email?: string
  advisor_password?: string
  advisor_first_name?: string
  advisor_last_name?: string
}
export type UpdateTenantRequest = components['schemas']['UpdateTenantDto']

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: components['schemas']['PageMetaDto']
}

export const tenantKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...tenantKeys.lists(), params] as const,
  details: () => [...tenantKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantKeys.details(), id] as const,
}
