import { apiClient } from '@/shared/lib/api'
import type {
  PaginatedResponse,
  PaginationParams,
  Tenant,
  UpdateTenantRequest,
} from '../types'
import type { CreateTenantFormValues } from '../types/create-tenant.schema'

export const tenantsService = {
  async findAll(params?: PaginationParams): Promise<PaginatedResponse<Tenant>> {
    const { data, error } = await apiClient.GET('/api/v1/tenants', {
      params: { query: params },
    })
    if (error) throw error
    return data as unknown as PaginatedResponse<Tenant>
  },

  async findOne(id: string): Promise<Tenant> {
    const { data, error } = await apiClient.GET('/api/v1/tenants/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as Tenant
  },

  async create(payload: CreateTenantFormValues): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (apiClient.POST as any)('/api/v1/tenants', {
      body: {
        name: payload.tenantName,
        slug: payload.tenantSlug,
        advisor_email: payload.email,
        advisor_password: payload.password,
        advisor_first_name: payload.firstName,
        advisor_last_name: payload.lastName,
      },
    })
    if (error) throw error
  },

  async update(id: string, payload: UpdateTenantRequest): Promise<Tenant> {
    const { data, error } = await apiClient.PATCH('/api/v1/tenants/{id}', {
      params: { path: { id } },
      body: payload,
    })
    if (error) throw error
    return data as unknown as Tenant
  },

  async remove(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/tenants/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },
}
