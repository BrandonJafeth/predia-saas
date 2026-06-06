import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { tenantsService } from '../services/tenants.service'
import { tenantKeys, type CreateTenantRequest, type PaginationParams, type UpdateTenantRequest } from '../types'

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
    mutationFn: (payload: CreateTenantRequest) => tenantsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

export const useUpdateTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTenantRequest & { id: string }) =>
      tenantsService.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}

export const useDeleteTenant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tenantsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() })
    },
  })
}
