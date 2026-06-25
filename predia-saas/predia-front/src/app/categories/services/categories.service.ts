import { apiClient } from '@/shared/lib/api'
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

export const categoriesService = {
  async findAll(): Promise<Category[]> {
    const { data, error } = await apiClient.GET('/api/v1/categories')
    if (error) throw error
    return data as unknown as Category[]
  },

  async findBySlug(slug: string): Promise<Category> {
    const { data, error } = await apiClient.GET('/api/v1/categories/{slug}', {
      params: { path: { slug } },
    })
    if (error) throw error
    return data as unknown as Category
  },

  async create(payload: CreateCategoryRequest): Promise<Category> {
    const { data, error } = await apiClient.POST('/api/v1/categories', {
      body: payload as Parameters<typeof apiClient.POST<'/api/v1/categories'>>[1]['body'],
    })
    if (error) throw error
    return data as unknown as Category
  },

  async update(id: string, payload: UpdateCategoryRequest): Promise<Category> {
    const { data, error } = await apiClient.PATCH('/api/v1/categories/{id}', {
      params: { path: { id } },
      body: payload as Parameters<typeof apiClient.PATCH<'/api/v1/categories/{id}'>>[1]['body'],
    })
    if (error) throw error
    return data as unknown as Category
  },

  async remove(id: string): Promise<Category> {
    const { data, error } = await apiClient.DELETE('/api/v1/categories/{id}', {
      params: { path: { id } },
    })
    if (error) throw error
    return data as unknown as Category
  },
}
