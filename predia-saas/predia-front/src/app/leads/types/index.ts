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
  // Resueltos por el backend (antes se buscaban en las primeras 100 entradas
  // de /users y /properties).
  assignee: { id: string; first_name: string; last_name: string } | null
  property: { id: string; title: string; slug: string } | null
}

export type LeadStats = components['schemas']['LeadStatsResponseDto']
export type LeadStatsFilters = Pick<LeadFilters, 'status' | 'assigned_to' | 'search'>

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

export type LeadActivityType = 'call' | 'email' | 'meeting' | 'note' | 'status_change'

export interface LeadActivityCreator {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  tenant_id: string
  type: LeadActivityType
  description: string
  created_by: string
  creator: LeadActivityCreator
  created_at: string
}

// Detalle de un lead (GET /leads/{id}) — incluye sus actividades recientes.
export interface LeadDetail extends Lead {
  activities: LeadActivity[]
}

export type CreateLeadActivityRequest = components['schemas']['CreateLeadActivityDto']

export interface LeadActivityFilters {
  page?: number
  limit?: number
}

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters?: LeadFilters) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  activities: (leadId: string) => [...leadKeys.detail(leadId), 'activities'] as const,
  activityList: (leadId: string, filters?: LeadActivityFilters) =>
    [...leadKeys.activities(leadId), filters] as const,
  statsAll: () => [...leadKeys.all, 'stats'] as const,
  stats: (filters?: LeadStatsFilters) => [...leadKeys.statsAll(), filters] as const,
}

// Nombre del agente: el del backend si corresponde al assigned_to actual; si
// no (p. ej. justo después de reasignar, con el cache optimista), el mapa.
export function assigneeName(lead: Lead, agentNameById?: Map<string, string>): string | undefined {
  if (!lead.assigned_to) return undefined
  if (lead.assignee?.id === lead.assigned_to) {
    return `${lead.assignee.first_name} ${lead.assignee.last_name}`
  }
  return agentNameById?.get(lead.assigned_to)
}

export function propertyTitle(lead: Lead, propertyNameById?: Map<string, string>): string | undefined {
  if (!lead.property_id) return undefined
  if (lead.property?.id === lead.property_id) return lead.property.title
  return propertyNameById?.get(lead.property_id)
}
