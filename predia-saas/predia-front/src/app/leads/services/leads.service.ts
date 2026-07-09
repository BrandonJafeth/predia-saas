import { apiClient } from '@/shared/lib/api'
import type {
  CreateLeadRequest,
  Lead,
  LeadFilters,
  PaginatedResponse,
  UpdateLeadRequest,
} from '../types'

export const leadsService = {
  async findAll(filters?: LeadFilters): Promise<PaginatedResponse<Lead>> {
    const { data, error } = await apiClient.GET('/api/v1/leads', {
      params: { query: filters },
    })
    if (error) throw error
    return data as unknown as PaginatedResponse<Lead>
  },

  async findOne(id: string): Promise<Lead> {
    const { data, error } = await apiClient.GET('/api/v1/leads/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as Lead
  },

  async create(payload: CreateLeadRequest): Promise<Lead> {
    const { data, error } = await apiClient.POST('/api/v1/leads', {
      body: payload,
    })
    if (error) throw error
    return data as unknown as Lead
  },

  async update(id: string, payload: UpdateLeadRequest): Promise<Lead> {
    const { data, error } = await apiClient.PATCH('/api/v1/leads/{id}', {
      params: { path: { id } },
      body: payload as Required<UpdateLeadRequest>,
    })
    if (error) throw error
    return data as unknown as Lead
  },

  async remove(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/leads/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },
}
