import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tokenStorage } from '@/shared/lib/tokens'
import { authService } from '../services/auth.service'
import { usersService } from '@/app/users/services/users.service'
import { notify } from '@/shared/lib/notifications'
import type { ForgotPasswordRequest, LoginRequest, LookupRequest, RegisterRequest, ResetPasswordRequest } from '../types'

export const useLookupTenants = () => {
  return useMutation({
    mutationFn: (payload: LookupRequest) => authService.lookupTenants(payload),
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      notify.success({ title: 'Sesión iniciada', description: 'Bienvenido al CRM' })
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken)
    },
  })
}

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => authService.refresh(),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return async () => {
    notify.info({ title: 'Sesión cerrada' })
    await authService.logout()
    tokenStorage.clearTokens()
    queryClient.clear()
  }
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authService.forgotPassword(payload),
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authService.resetPassword(payload),
    onSuccess: () => {
      notify.success({ title: 'Contraseña actualizada', description: 'Ya puedes iniciar sesión' })
    },
  })
}

export const useCurrentUser = () => {
  const hasToken = !!tokenStorage.decodeAccessToken()

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => usersService.findMe(),
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  })
}
