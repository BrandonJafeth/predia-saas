import { tokenStorage } from '@/shared/lib/tokens'

export interface UserWithTenant {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'super_admin' | 'admin' | 'agent'
  status: 'active' | 'suspended' | 'invited' | 'deactivated'
  created_at: string
  updated_at: string
  tenant: { id: string; name: string; slug: string }
}

export interface PaginatedSystemUsers {
  data: UserWithTenant[]
  meta: {
    page: number
    limit: number
    itemCount: number
    pageCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export interface SystemUserParams {
  page?: number
  limit?: number
}

export interface CreateSuperAdminRequest {
  email: string
  password: string
  first_name: string
  last_name: string
}

export interface CreatedSuperAdmin {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

const baseUrl = () => import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function authHeaders() {
  const token = tokenStorage.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function systemGet<T>(path: string, query?: Record<string, unknown>): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`)
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json() as Promise<T>
}

async function systemPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await res.json()
  return res.json() as Promise<T>
}

async function systemPatch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: authHeaders(),
  })
  if (!res.ok) throw await res.json()
  return res.json() as Promise<T>
}

export const systemService = {
  findAllUsers(params?: SystemUserParams): Promise<PaginatedSystemUsers> {
    return systemGet<PaginatedSystemUsers>('/system/users', params as Record<string, unknown>)
  },
  findUsersByTenant(tenantId: string, params?: SystemUserParams): Promise<PaginatedSystemUsers> {
    return systemGet<PaginatedSystemUsers>(`/system/tenants/${tenantId}/users`, params as Record<string, unknown>)
  },
  createSuperAdmin(payload: CreateSuperAdminRequest): Promise<CreatedSuperAdmin> {
    return systemPost<CreatedSuperAdmin>('/system/superadmins', payload)
  },
  suspend(id: string): Promise<UserWithTenant> {
    return systemPatch<UserWithTenant>(`/api/v1/users/${id}/suspend`)
  },
  activate(id: string): Promise<UserWithTenant> {
    return systemPatch<UserWithTenant>(`/api/v1/users/${id}/activate`)
  },
}
