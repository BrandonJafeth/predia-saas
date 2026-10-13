import { SetMetadata } from '@nestjs/common';
import { ApiKeyScope } from '@prisma/client';
import { API_KEY_SCOPES_KEY } from './api-key-scopes.constant';

/** Restringe un handler de la API pública a ciertos scopes de key. */
export const ApiKeyScopes = (...scopes: ApiKeyScope[]) =>
  SetMetadata(API_KEY_SCOPES_KEY, scopes);
