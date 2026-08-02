import { apiClient } from '@/shared/lib/api'
import type { Amenity } from '../types'

// The category-amenity endpoints are not in the generated schema yet. Cast the
// client to bypass PathsWithMethod validation without using any (same pattern
// as properties.service).
const { POST, DELETE } = apiClient as unknown as {
  POST: (url: string, options?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  DELETE: (url: string, options?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
}

export const amenitiesService = {
  async findAll(): Promise<Amenity[]> {
    const { data, error } = await apiClient.GET('/api/v1/amenities')
    if (error) throw error
    return data as Amenity[]
  },

  async addToCategory(categoryId: string, amenityIds: string[]) {
    const { data, error } = await POST(`/api/v1/categories/${categoryId}/amenities`, {
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async removeFromCategory(categoryId: string, amenityIds: string[]) {
    const { data, error } = await DELETE(`/api/v1/categories/${categoryId}/amenities`, {
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async addToProperty(propertyId: string, amenityIds: string[]) {
    const { data, error } = await POST(`/api/v1/properties/${propertyId}/amenities`, {
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async removeFromProperty(propertyId: string, amenityIds: string[]) {
    const { data, error } = await DELETE(`/api/v1/properties/${propertyId}/amenities`, {
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },
}