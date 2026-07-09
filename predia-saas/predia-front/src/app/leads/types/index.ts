import type { components } from '@predia/api-types'

export type LeadSource = 'web' | 'referral' | 'walk_in' | 'social' | 'other'
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'archived'

// Definido manualmente — openapi-typescript infiere los campos nullable como
// Record<string,never>, igual que en users/types/index.ts.
export interface Lead {
  id: string
  tenant_id: string
  name: string
  email: string | null
  phone: string | null
  source: LeadSource
  status: LeadStatus
  assigned_to: string | null
  property_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CreateLeadRequest = components['schemas']['CreateLeadDto']
export type UpdateLeadRequest = Partial<components['schemas']['UpdateLeadDto']>

export interface LeadFilters {
  page?: number
  limit?: number
  status?: LeadStatus
  assigned_to?: string
  search?: string
  sortBy?: 'name' | 'status' | 'source' | 'created_at'
  sortOrder?: 'asc' | 'desc'
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

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters?: LeadFilters) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
}
