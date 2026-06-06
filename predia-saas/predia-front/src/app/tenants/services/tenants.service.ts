import { apiClient } from '@/shared/lib/api'
import type {
  CreateTenantRequest,
  PaginatedResponse,
  PaginationParams,
  Tenant,
  UpdateTenantRequest,
} from '../types'

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

  async create(payload: CreateTenantRequest): Promise<Tenant> {
    const { data, error } = await apiClient.POST('/api/v1/tenants', {
      body: payload,
    })
    if (error) throw error
    return data as unknown as Tenant
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
