import { apiClient } from '@/shared/lib/api'
import type {
  CreateLeadActivityRequest,
  CreateLeadRequest,
  Lead,
  LeadActivity,
  LeadActivityFilters,
  LeadDetail,
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

  async findOne(id: string): Promise<LeadDetail> {
    const { data, error } = await apiClient.GET('/api/v1/leads/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as LeadDetail
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

  async findActivities(
    leadId: string,
    filters?: LeadActivityFilters,
  ): Promise<PaginatedResponse<LeadActivity>> {
    const { data, error } = await apiClient.GET('/api/v1/leads/{leadId}/activities', {
      params: { path: { leadId }, query: filters },
    })
    if (error) throw error
    return data as unknown as PaginatedResponse<LeadActivity>
  },

  async createActivity(
    leadId: string,
    payload: CreateLeadActivityRequest,
  ): Promise<LeadActivity> {
    const { data, error } = await apiClient.POST('/api/v1/leads/{leadId}/activities', {
      params: { path: { leadId } },
      body: payload,
    })
    if (error) throw error
    return data as unknown as LeadActivity
  },
}
