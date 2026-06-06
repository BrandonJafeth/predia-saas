import { apiClient } from '@/shared/lib/api'
import type {
  CreateUserRequest,
  PaginatedUsers,
  PaginationParams,
  User,
  UpdateUserRequest,
} from '../types'

export const usersService = {
  async findAll(params?: PaginationParams): Promise<PaginatedUsers> {
    const { data, error } = await apiClient.GET('/api/v1/users', {
      params: { query: params },
    })
    if (error) throw error
    return data
  },

  async findOne(id: string): Promise<User> {
    const { data, error } = await apiClient.GET('/api/v1/users/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data
  },

  async create(payload: CreateUserRequest): Promise<User> {
    const { data, error } = await apiClient.POST('/api/v1/users', {
      body: payload,
    })
    if (error) throw error
    return data
  },

  async update(id: string, payload: UpdateUserRequest): Promise<User> {
    const { data, error } = await apiClient.PATCH('/api/v1/users/{id}', {
      params: { path: { id } },
      body: payload,
    })
    if (error) throw error
    return data
  },


  async remove(id: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/users/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
  },
}
