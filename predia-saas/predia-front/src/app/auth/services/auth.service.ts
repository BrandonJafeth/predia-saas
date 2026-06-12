import { apiClient } from '@/shared/lib/api'
import type { AuthResponse, ForgotPasswordRequest, LoginRequest, LookupRequest, RegisterRequest, ResetPasswordRequest, TenantOption } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await res.json()
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw await res.json()
  },

  async validateResetToken(token: string): Promise<{ valid: true }> {
    const res = await fetch(`${BASE_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
    if (!res.ok) throw await res.json()
    return res.json() as Promise<{ valid: true }>
  },
}
