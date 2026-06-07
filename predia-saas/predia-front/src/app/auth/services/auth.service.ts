import { apiClient } from '@/shared/lib/api'
import type { AuthResponse, LoginRequest, LookupRequest, RegisterRequest, TenantOption } from '../types'

export const authService = {
  async lookupTenants(payload: LookupRequest): Promise<TenantOption[]> {
    const { data, error } = await apiClient.POST('/auth/lookup', { body: payload })
    if (error) throw error
    return data
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data, error } = await apiClient.POST('/auth/login', { body: payload })
    if (error) throw error
    return data
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data, error } = await apiClient.POST('/auth/register', { body: payload })
    if (error) throw error
    return data
  },

  async refresh(): Promise<AuthResponse> {
    const { data, error } = await apiClient.POST('/auth/refresh', {})
    if (error) throw error
    return data
  },

  async logout(): Promise<void> {
    await apiClient.POST('/auth/logout', {})
  },
}
