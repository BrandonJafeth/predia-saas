import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { amenitiesService } from '../services/amenities.service'
import { amenityKeys } from '../types'
import { categoryKeys } from '@/app/categories/types'
import { propertyKeys } from '@/app/properties/types'
import { notify, extractApiError } from '@/shared/lib/notifications'

const STALE_1H = 1000 * 60 * 60

export const useAmenities = () => {
  return useQuery({
    queryKey: amenityKeys.lists(),
    queryFn: () => amenitiesService.findAll(),
    staleTime: STALE_1H,
  })
}

interface CategoryAmenityMutation {
  categoryId: string
  amenityIds: string[]
}

export const useAddCategoryAmenities = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, amenityIds }: CategoryAmenityMutation) =>
      amenitiesService.addToCategory(categoryId, amenityIds),
    onSuccess: (_data, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detailById(categoryId) })
    },
    onError: (err) => {
      notify.error({ title: 'Error al guardar amenidades', description: extractApiError(err) })
    },
  })
}

export const useRemoveCategoryAmenities = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ categoryId, amenityIds }: CategoryAmenityMutation) =>
      amenitiesService.removeFromCategory(categoryId, amenityIds),
    onSuccess: (_data, { categoryId }) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: categoryKeys.detailById(categoryId) })
    },
    onError: (err) => {
      notify.error({ title: 'Error al quitar amenidades', description: extractApiError(err) })
    },
  })
}

interface PropertyAmenityMutation {
  propertyId: string
  amenityIds: string[]
}

export const useAddPropertyAmenities = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ propertyId, amenityIds }: PropertyAmenityMutation) =>
      amenitiesService.addToProperty(propertyId, amenityIds),
    onSuccess: (_data, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
    },
    onError: (err) => {
      notify.error({ title: 'Error al guardar amenidades', description: extractApiError(err) })
    },
  })
}

export const useRemovePropertyAmenities = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ propertyId, amenityIds }: PropertyAmenityMutation) =>
      amenitiesService.removeFromProperty(propertyId, amenityIds),
    onSuccess: (_data, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
    },
    onError: (err) => {
      notify.error({ title: 'Error al quitar amenidades', description: extractApiError(err) })
    },
  })
}