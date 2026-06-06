import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tokenStorage } from '@/shared/lib/tokens'
import { authService } from '../services/auth.service'
import type { LoginRequest, RegisterRequest } from '../types'

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
    },
  })
}

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => authService.refresh(),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return () => {
    tokenStorage.clearTokens()
    queryClient.clear()
  }
}
