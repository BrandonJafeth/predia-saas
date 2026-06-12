import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'
import { tenantKeys, type PaginationParams, type UpdateTenantRequest } from '../types'
import type { CreateTenantFormValues } from '../types/create-tenant.schema'
import { notify, extractApiError } from '@/shared/lib/notifications'

export const useTenants = (params?: PaginationParams) => {
  return useQuery({
    queryKey: tenantKeys.list(params),
    queryFn: () => tenantsService.findAll(params),
  })
}

export const useTenant = (id: string) => {
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: () => tenantsService.findOne(id),
    enabled: !!id,
  })
}

export const useCreateTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTenantFormValues) => tenantsService.create(payload),
    onSuccess: () => {
      notify.success({ title: 'Organización creada' })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear organización', description: extractApiError(err) })
    },
  })
}

export const useUpdateTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTenantRequest & { id: string }) =>
      tenantsService.update(id, payload),
    onSuccess: (_, { id }) => {
      notify.success({ title: 'Organización actualizada' })
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al actualizar organización', description: extractApiError(err) })
    },
  })
}

export const useDeleteTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tenantsService.remove(id),
    onSuccess: () => {
      notify.success({ title: 'Organización eliminada' })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar organización', description: extractApiError(err) })
    },
  })
}
