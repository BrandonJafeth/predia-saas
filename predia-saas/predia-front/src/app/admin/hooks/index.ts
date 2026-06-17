import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { systemService, type SystemUserParams, type CreateSuperAdminRequest } from '../services/system.service'
import { auditLogService, type QueryAuditLogParams } from '../services/audit-log.service'
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

export const auditLogKeys = {
  system: () => ['system', 'audit-log'] as const,
  systemList: (params?: QueryAuditLogParams) => [...auditLogKeys.system(), params] as const,
  tenant: () => ['tenant', 'audit-log'] as const,
  tenantList: (params?: QueryAuditLogParams) => [...auditLogKeys.tenant(), params] as const,
}

export const useSystemAuditLog = (params?: QueryAuditLogParams) => {
  return useQuery({
    queryKey: auditLogKeys.systemList(params),
    queryFn: () => auditLogService.getSystemAuditLog(params),
  })
}

export const useTenantAuditLog = (params?: QueryAuditLogParams) => {
  return useQuery({
    queryKey: auditLogKeys.tenantList(params),
    queryFn: () => auditLogService.getTenantAuditLog(params),
  })
}

export const useSystemSuspendUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => systemService.suspend(id),
    onSuccess: () => {
      notify.success({ title: 'Usuario suspendido' })
      queryClient.invalidateQueries({ queryKey: systemKeys.users() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al suspender usuario', description: extractApiError(err) })
    },
  })
}

export const useSystemActivateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => systemService.activate(id),
    onSuccess: () => {
      notify.success({ title: 'Usuario activado' })
      queryClient.invalidateQueries({ queryKey: systemKeys.users() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al activar usuario', description: extractApiError(err) })
    },
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
