import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { propertiesService } from '../services/properties.service'
import {
  propertyKeys,
  type CreatePropertyRequest,
  type PropertyFilters,
  type UpdatePropertyRequest,
} from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => propertiesService.findAll(filters),
    staleTime: 1000 * 60 * 2, // 2 min
  })
}

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesService.findOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 min — detail changes less often
  })
}

export const useCreateProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePropertyRequest) => propertiesService.create(payload),
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
      propertiesService.update(id, payload),
    onSuccess: (data) => {
      notify.success({ title: 'Propiedad actualizada' })
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al actualizar propiedad', description: extractApiError(err) })
    },
  })
}

export const useDeleteProperty = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => propertiesService.remove(id),
    onSuccess: () => {
      notify.success({ title: 'Propiedad eliminada' })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar propiedad', description: extractApiError(err) })
    },
  })
}
