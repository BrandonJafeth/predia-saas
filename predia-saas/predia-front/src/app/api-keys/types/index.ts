import type { components } from '@predia/api-types'

export type ApiKey = components['schemas']['ApiKeyResponseDto']
export type CreatedApiKey = components['schemas']['CreatedApiKeyResponseDto']
export type CreateApiKeyRequest = components['schemas']['CreateApiKeyDto']
export type ApiKeyType = ApiKey['type']

export const apiKeyKeys = {
  all: ['api-keys'] as const,
  list: () => [...apiKeyKeys.all, 'list'] as const,
}
