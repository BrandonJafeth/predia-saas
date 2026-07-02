import { apiClient } from '@/shared/lib/api'
import type {
  CreatePropertyRequest,
  PaginatedResponse,
  Property,
  PropertyFilters,
  UpdatePropertyRequest,
} from '../types'

// GET /PATCH /DELETE for properties are not in the schema yet (backend pending).
// Cast the methods to bypass PathsWithMethod validation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseFetch = (...args: any[]) => Promise<{ data: unknown; error: unknown }>

// Lazy accessors — avoids accessing apiClient at module-load time (TDZ risk)
const get: LooseFetch = (...args) => (apiClient.GET as unknown as LooseFetch)(...args)
const patch: LooseFetch = (...args) => (apiClient.PATCH as unknown as LooseFetch)(...args)
const del: LooseFetch = (...args) => (apiClient.DELETE as unknown as LooseFetch)(...args)

export const propertiesService = {
  async findAll(filters?: PropertyFilters): Promise<PaginatedResponse<Property>> {
    const { data, error } = await get('/api/v1/properties', { params: { query: filters } })
    if (error) throw error
    return data as PaginatedResponse<Property>
  },

  async findOne(id: string): Promise<Property> {
    const { data, error } = await get(`/api/v1/properties/${id}`)
    if (error) throw error
    return data as Property
  },

  async create(payload: CreatePropertyRequest): Promise<Property> {
    const { data, error } = await apiClient.POST('/api/v1/properties', { body: payload })
    if (error) throw error
    return data as unknown as Property
  },

  async update(id: string, payload: UpdatePropertyRequest): Promise<Property> {
    const { data, error } = await patch(`/api/v1/properties/${id}`, {
      body: payload,
    })
    if (error) throw error
    return data as Property
  },

  async remove(id: string): Promise<void> {
    const { error } = await del(`/api/v1/properties/${id}`)
    if (error) throw error
  },
}
