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

export const useProperties = (filters?: PropertyFilters, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    enabled: options?.enabled ?? true,
    queryFn: () => propertiesService.getProperties(filters),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}

// Conteos agregados del tenant (dashboard). Antes se calculaban en el cliente
// sobre las primeras 100 propiedades.
export const usePropertyStats = () => {
  return useQuery({
    queryKey: propertyKeys.stats(),
    queryFn: () => propertiesService.getStats(),
    staleTime: 1000 * 60 * 2,
  })
}

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => propertiesService.getProperty(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
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
      queryClient.invalidateQueries({ queryKey: propertyKeys.stats() })
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
        // Optimistic patch only — response-shaped (string) and request-shaped (number)
        // field types legitimately differ; onSettled invalidation replaces this with real data.
        queryClient.setQueryData<Property>(propertyKeys.detail(id), {
          ...previous,
          ...payload,
        } as Property)
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
      queryClient.invalidateQueries({ queryKey: propertyKeys.stats() })
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
      queryClient.invalidateQueries({ queryKey: propertyKeys.stats() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar propiedad', description: extractApiError(err) })
    },
  })
}
