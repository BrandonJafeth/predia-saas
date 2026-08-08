import { apiClient } from '@/shared/lib/api'
import type { components } from '@predia/api-types'
import type {
  CreatePropertyRequest,
  PaginatedResponse,
  Property,
  PropertyDetail,
  PropertyFilters,
  UpdatePropertyRequest,
} from '../types'

export const propertiesService = {
  async getProperties(filters?: PropertyFilters): Promise<PaginatedResponse<Property>> {
    const { data, error } = await apiClient.GET('/api/v1/properties', {
      params: { query: filters },
    })
    if (error) throw error
    return data as unknown as PaginatedResponse<Property>
  },

  async getProperty(id: string): Promise<PropertyDetail> {
    const { data, error } = await apiClient.GET('/api/v1/properties/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as PropertyDetail
  },

  async getPropertyBySlug(slug: string): Promise<PropertyDetail> {
    const { data, error } = await apiClient.GET('/api/v1/properties/slug/{slug}', {
      params: { path: { slug } },
    })
    if (error) throw error
    return data as unknown as PropertyDetail
  },

  async createProperty(payload: CreatePropertyRequest): Promise<Property> {
    // attributes is Record<string, unknown> on our type (see types/index.ts) but the
    // generated client expects the openapi-typescript Record<string, never> quirk.
    const { data, error } = await apiClient.POST('/api/v1/properties', {
      body: payload as components['schemas']['CreatePropertyDto'],
    })
    if (error) throw error
    return data as unknown as Property
  },

  async updateProperty(id: string, payload: UpdatePropertyRequest): Promise<Property> {
    // UpdatePropertyDto en el schema declara currency/is_published como
    // requeridos (quirk del DTO del backend) aunque el PATCH acepta partials.
    const { data, error } = await apiClient.PATCH('/api/v1/properties/{id}', {
      params: { path: { id } },
      body: payload as components['schemas']['UpdatePropertyDto'],
    })
    if (error) throw error
    return data as unknown as Property
  },

  async deleteProperty(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/properties/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },
}
