import { apiClient } from '@/shared/lib/api'
import type {
  CreatePropertyRequest,
  PaginatedResponse,
  Property,
  PropertyFilters,
  UpdatePropertyRequest,
} from '../types'

// GET /PATCH /DELETE for properties are not in the schema yet (backend pending).
// Cast the client to bypass PathsWithMethod validation without using any.
const { GET, PATCH, DELETE } = apiClient as unknown as {
  GET: (url: string, options?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  PATCH: (url: string, options?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  DELETE: (url: string, options?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
}

export const propertiesService = {
  async getProperties(filters?: PropertyFilters): Promise<PaginatedResponse<Property>> {
    const { data, error } = await GET('/api/v1/properties', { params: { query: filters } })
    if (error) throw error
    return data as PaginatedResponse<Property>
  },

  async getProperty(id: string): Promise<Property> {
    const { data, error } = await GET(`/api/v1/properties/${id}`)
    if (error) throw error
    return data as Property
  },

  async getPropertyBySlug(slug: string): Promise<Property> {
    const { data, error } = await GET(`/api/v1/properties/slug/${slug}`)
    if (error) throw error
    return data as Property
  },

  async createProperty(payload: CreatePropertyRequest): Promise<Property> {
    const { data, error } = await apiClient.POST('/api/v1/properties', { body: payload })
    if (error) throw error
    return data as unknown as Property
  },

  async updateProperty(id: string, payload: UpdatePropertyRequest): Promise<Property> {
    const { data, error } = await PATCH(`/api/v1/properties/${id}`, {
      body: payload,
    })
    if (error) throw error
    return data as Property
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await DELETE(`/api/v1/properties/${id}`)
    if (error) throw error
  },
}
