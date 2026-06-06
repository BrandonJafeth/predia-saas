import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tokenStorage } from '@/shared/lib/tokens'
import { authService } from '../services/auth.service'
import { usersService } from '@/app/users/services/users.service'
import type { LoginRequest, RegisterRequest } from '../types'

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken)
      queryClient.invalidateQueries({ queryKey: ['auth'] })
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
    await authService.logout()
    tokenStorage.clearTokens()
    queryClient.clear()
  }
}

export const useCurrentUser = () => {
  const payload = tokenStorage.decodeAccessToken()
  const userId = payload?.sub ?? ''

  return useQuery({
    queryKey: ['auth', 'me', userId],
    queryFn: () => usersService.findOne(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
