import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import {
  userKeys,
  type CreateUserRequest,
  type PaginationParams,
  type UpdateUserRequest,
} from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

export const useUsers = (params?: PaginationParams) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersService.findAll(params),
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersService.findOne(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => usersService.create(payload),
    onSuccess: () => {
      notify.success({ title: 'Usuario creado' })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al crear usuario', description: extractApiError(err) })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateUserRequest & { id: string }) =>
      usersService.update(id, payload),
    onSuccess: (_, { id }) => {
      notify.success({ title: 'Usuario actualizado' })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al actualizar usuario', description: extractApiError(err) })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      notify.success({ title: 'Usuario eliminado' })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al eliminar usuario', description: extractApiError(err) })
    },
  })
}

export const useSuspendUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersService.suspend(id),
    onSuccess: (_, id) => {
      notify.success({ title: 'Usuario suspendido' })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al suspender usuario', description: extractApiError(err) })
    },
  })
}

export const useActivateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersService.activate(id),
    onSuccess: (_, id) => {
      notify.success({ title: 'Usuario activado' })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al activar usuario', description: extractApiError(err) })
    },
  })
}
