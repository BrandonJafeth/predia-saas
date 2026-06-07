import { apiClient } from '@/shared/lib/api'
import type { AuthResponse, LoginRequest, LookupRequest, RegisterRequest, TenantOption } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const authService = {
  async lookupTenants(payload: LookupRequest): Promise<TenantOption[]> {
    const res = await fetch(`${BASE_URL}/auth/lookup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await res.json()
    return res.json() as Promise<TenantOption[]>
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await res.json()
    return res.json() as Promise<AuthResponse>
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data, error } = await apiClient.POST('/auth/register', {
      body: payload,
    })
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
