import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { propertiesService } from '../services/properties.service'
import {
  propertyKeys,
  type CreatePropertyRequest,
  type Property,
  type PropertyFilters,
  type UpdatePropertyRequest,
} from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => propertiesService.getProperties(filters),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesService.getProperty(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

export const usePropertyBySlug = (slug: string) => {
  return useQuery({
    queryKey: propertyKeys.bySlug(slug),
    queryFn: () => propertiesService.getPropertyBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

export const useCreateProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePropertyRequest) => propertiesService.createProperty(payload),
    onSuccess: () => {
      notify.success({ title: 'Propiedad creada' })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear propiedad', description: extractApiError(err) })
    },
  })
}

export const useUpdateProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePropertyRequest & { id: string }) =>
      propertiesService.updateProperty(id, payload),
    onMutate: async ({ id, ...payload }) => {
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(id) })
      const previous = queryClient.getQueryData<Property>(propertyKeys.detail(id))
      if (previous) {
        queryClient.setQueryData<Property>(propertyKeys.detail(id), { ...previous, ...payload })
      }
      return { previous }
    },
    onError: (err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(propertyKeys.detail(id), context.previous)
      }
      notify.error({ title: 'Error al actualizar propiedad', description: extractApiError(err) })
    },
    onSuccess: () => {
      notify.success({ title: 'Propiedad actualizada' })
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

export const useDeleteProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.deleteProperty(id),
    onSuccess: () => {
      notify.success({ title: 'Propiedad eliminada' })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar propiedad', description: extractApiError(err) })
    },
  })
}
