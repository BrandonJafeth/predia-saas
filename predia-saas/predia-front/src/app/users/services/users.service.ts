import { apiClient } from '@/shared/lib/api'
import type {
  CreateUserRequest,
  PaginatedResponse,
  PaginationParams,
  User,
  UpdateUserRequest,
} from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoosePatch = (...args: any[]) => Promise<{ data: unknown; error: unknown }>
const loosePatch = apiClient.PATCH as unknown as LoosePatch

export const usersService = {
  async findAll(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const { data, error } = await apiClient.GET('/api/v1/users', {
      params: { query: params },
    })
    if (error) throw error
    return data as unknown as PaginatedResponse<User>
  },

  async findMe(): Promise<User> {
    const { data, error } = await apiClient.GET(
      '/api/v1/users/me' as unknown as '/api/v1/users/{id}',
      { params: { path: { id: 'me' } } },
    )
    if (error) throw error
    return data as unknown as User
  },

  async findOne(id: string): Promise<User> {
    const { data, error } = await apiClient.GET('/api/v1/users/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as User
  },

  async create(payload: CreateUserRequest): Promise<User> {
    const { data, error } = await apiClient.POST('/api/v1/users', {
      body: payload,
    })
    if (error) throw error
    return data as unknown as User
  },

  async update(id: string, payload: UpdateUserRequest): Promise<User> {
    const { data, error } = await apiClient.PATCH('/api/v1/users/{id}', {
      params: { path: { id } },
      // schema marks role as required but PATCH accepts partial fields; cast is intentional
      body: payload as Required<UpdateUserRequest>,
    })
    if (error) throw error
    return data as unknown as User
  },

  async suspend(id: string): Promise<User> {
    const { data, error } = await loosePatch('/api/v1/users/{id}/suspend', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as User
  },

  async activate(id: string): Promise<User> {
    const { data, error } = await loosePatch('/api/v1/users/{id}/activate', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as User
  },

  async remove(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/users/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },
}
