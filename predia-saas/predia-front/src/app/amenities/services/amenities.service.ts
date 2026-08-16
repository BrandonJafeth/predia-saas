import { apiClient } from '@/shared/lib/api'
import type { Amenity } from '../types'

export const amenitiesService = {
  async findAll(): Promise<Amenity[]> {
    const { data, error } = await apiClient.GET('/api/v1/amenities')
    if (error) throw error
    return data as Amenity[]
  },

  async create(name: string): Promise<Amenity> {
    const { data, error } = await apiClient.POST('/api/v1/amenities', {
      body: { name },
    })
    if (error) throw error
    return data as Amenity
  },

  async rename(id: string, name: string): Promise<Amenity> {
    const { data, error } = await apiClient.PATCH('/api/v1/amenities/{id}', {
      params: { path: { id } },
      body: { name },
    })
    if (error) throw error
    return data as Amenity
  },

  async remove(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/amenities/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },

  async addToCategory(categoryId: string, amenityIds: string[]) {
    const { data, error } = await apiClient.POST('/api/v1/categories/{categoryId}/amenities', {
      params: { path: { categoryId } },
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async removeFromCategory(categoryId: string, amenityIds: string[]) {
    const { data, error } = await apiClient.DELETE('/api/v1/categories/{categoryId}/amenities', {
      params: { path: { categoryId } },
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async addToProperty(propertyId: string, amenityIds: string[]) {
    const { data, error } = await apiClient.POST('/api/v1/properties/{propertyId}/amenities', {
      params: { path: { propertyId } },
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },

  async removeFromProperty(propertyId: string, amenityIds: string[]) {
    const { data, error } = await apiClient.DELETE('/api/v1/properties/{propertyId}/amenities', {
      params: { path: { propertyId } },
      body: { amenity_ids: amenityIds },
    })
    if (error) throw error
    return data
  },
}