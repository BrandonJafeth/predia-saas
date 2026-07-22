import { apiClient } from '@/shared/lib/api'
import type { Location, LocationNode } from '../types'

export const locationsService = {
  async getTree(): Promise<LocationNode[]> {
    const { data, error } = await apiClient.GET('/api/v1/locations/tree')
    if (error) throw error
    return data as unknown as LocationNode[]
  },

  async getProvinces(): Promise<Location[]> {
    const { data, error } = await apiClient.GET('/api/v1/locations')
    if (error) throw error
    return data as unknown as Location[]
  },

  async getChildren(id: string): Promise<Location[]> {
    const { data, error } = await apiClient.GET('/api/v1/locations/{id}/children', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as Location[]
  },
}
