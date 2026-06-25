import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriesService } from '../services/categories.service'
import { categoryKeys, type CreateCategoryRequest, type UpdateCategoryRequest } from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

const STALE_24H = 1000 * 60 * 60 * 24

export const useCategories = () => {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: () => categoriesService.findAll(),
    staleTime: STALE_24H,
  })
}

export const useCategory = (slug: string) => {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => categoriesService.findBySlug(slug),
    enabled: !!slug,
    staleTime: STALE_24H,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoriesService.create(payload),
    onSuccess: () => {
      notify.success({ title: 'Categoría creada' })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear categoría', description: extractApiError(err) })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryRequest & { id: string }) =>
      categoriesService.update(id, payload),
    onSuccess: (data) => {
      notify.success({ title: 'Categoría actualizada' })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(data.slug) })
    },
    onError: (err) => {
      notify.error({ title: 'Error al actualizar categoría', description: extractApiError(err) })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      notify.success({ title: 'Categoría eliminada' })
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar categoría', description: extractApiError(err) })
    },
  })
}
