import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { systemService, type SystemUserParams, type CreateSuperAdminRequest } from '../services/system.service'

export const systemKeys = {
  all: ['system'] as const,
  users: () => [...systemKeys.all, 'users'] as const,
  usersList: (params?: SystemUserParams) => [...systemKeys.users(), params] as const,
}

export const useAllUsers = (params?: SystemUserParams) => {
  return useQuery({
    queryKey: systemKeys.usersList(params),
    queryFn: () => systemService.findAllUsers(params),
  })
}

export const useCreateSuperAdmin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSuperAdminRequest) => systemService.createSuperAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.users() })
    },
  })
}
