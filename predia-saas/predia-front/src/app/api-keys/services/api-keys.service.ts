import { apiClient } from '@/shared/lib/api'
import type { ApiKey, CreateApiKeyRequest, CreatedApiKey } from '../types'

export const apiKeysService = {
  async findAll(): Promise<ApiKey[]> {
    const { data, error } = await apiClient.GET('/api/v1/api-keys')
    if (error) throw error
    return data
  },

  async create(payload: CreateApiKeyRequest): Promise<CreatedApiKey> {
    const { data, error } = await apiClient.POST('/api/v1/api-keys', { body: payload })
    if (error) throw error
    return data
  },

  async revoke(id: string): Promise<ApiKey> {
    const { data, error } = await apiClient.DELETE('/api/v1/api-keys/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data
  },
}
