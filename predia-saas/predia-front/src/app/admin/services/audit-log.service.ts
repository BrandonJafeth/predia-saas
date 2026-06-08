import { tokenStorage } from '@/shared/lib/tokens'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'REVOKE'
export type AuditEntity = 'property' | 'user' | 'tenant' | 'api_key' | 'lead'
export type AuditActorRole = 'super_admin' | 'admin' | 'agent'

export interface AuditLogEntry {
  id: string
  actor_id: string
  actor_name: string | null
  actor_email: string | null
  actor_role: AuditActorRole
  action: AuditAction
  entity: AuditEntity
  entity_id: string
  payload: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  tenant_id: string | null
  tenant_name: string | null
  tenant_slug: string | null
  created_at: string
}

export interface PaginatedAuditLog {
  data: AuditLogEntry[]
  meta: {
    page: number
    limit: number
    itemCount: number
    pageCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export interface QueryAuditLogParams {
  entity?: AuditEntity
  action?: AuditAction
  actor_id?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

const baseUrl = () => import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

function authHeaders() {
  const token = tokenStorage.getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function auditGet<T>(path: string, query?: Record<string, unknown>): Promise<T> {
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

export const auditLogService = {
  getSystemAuditLog(params?: QueryAuditLogParams): Promise<PaginatedAuditLog> {
    return auditGet<PaginatedAuditLog>(
      '/api/v1/audit-log/system',
      params as Record<string, unknown>,
    )
  },
}
