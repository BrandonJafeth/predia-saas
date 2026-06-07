import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { systemService, type SystemUserParams, type CreateSuperAdminRequest } from '../services/system.service'
import { notify, extractApiError } from '@/shared/lib/notifications'

export const systemKeys = {
  all: ['system'] as const,
  users: () => [...systemKeys.all, 'users'] as const,
  usersList: (params?: SystemUserParams) => [...systemKeys.users(), params] as const,
  tenantUsers: (tenantId: string, params?: SystemUserParams) =>
    [...systemKeys.all, 'tenants', tenantId, 'users', params] as const,
}

export const useAllUsers = (params?: SystemUserParams) => {
  return useQuery({
    queryKey: systemKeys.usersList(params),
    queryFn: () => systemService.findAllUsers(params),
  })
}

export const useUsersByTenant = (tenantId: string, params?: SystemUserParams) => {
  return useQuery({
    queryKey: systemKeys.tenantUsers(tenantId, params),
    queryFn: () => systemService.findUsersByTenant(tenantId, params),
    enabled: !!tenantId,
  })
}

export const useCreateSuperAdmin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSuperAdminRequest) => systemService.createSuperAdmin(payload),
    onSuccess: () => {
      notify.success({ title: 'Super admin creado' })
      queryClient.invalidateQueries({ queryKey: systemKeys.users() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear super admin', description: extractApiError(err) })
    },
  })
}
