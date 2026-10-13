import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { extractApiError, notify } from '@/shared/lib/notifications'
import { apiKeysService } from '../services/api-keys.service'
import { apiKeyKeys, type CreateApiKeyRequest } from '../types'

export const useApiKeys = () =>
  useQuery({ queryKey: apiKeyKeys.list(), queryFn: () => apiKeysService.findAll() })

// La key en texto plano solo vive en la respuesta de esta mutación: no se
// guarda en el cache de React Query (la lista se refetchea sin ella).
export const useCreateApiKey = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApiKeyRequest) => apiKeysService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() }),
    onError: (err) =>
      notify.error({ title: 'No se pudo crear la API key', description: extractApiError(err) }),
  })
}

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiKeysService.revoke(id),
    onSuccess: () => {
      notify.success({ title: 'API key revocada', description: 'Dejó de funcionar al instante.' })
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.list() })
    },
    onError: (err) =>
      notify.error({ title: 'No se pudo revocar la API key', description: extractApiError(err) }),
  })
}
