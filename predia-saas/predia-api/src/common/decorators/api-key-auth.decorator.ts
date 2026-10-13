import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyScope } from '@prisma/client';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { API_KEY_SCOPES_KEY } from './api-key-scopes.constant';
import { Public } from './public.decorator';

/**
 * Endpoint de la API pública: sin JWT (@Public) y autenticado con X-API-Key.
 * `scopes` limita qué tipo de key puede llamarlo (tenant / portal).
 */
export const ApiKeyAuth = (...scopes: ApiKeyScope[]) =>
  applyDecorators(
    Public(),
    SetMetadata(
      API_KEY_SCOPES_KEY,
      scopes.length > 0 ? scopes : [ApiKeyScope.tenant, ApiKeyScope.portal],
    ),
    UseGuards(ApiKeyGuard),
    ApiSecurity('api-key'),
    ApiHeader({
      name: 'X-API-Key',
      required: true,
      description: 'pk_… (navegador, atada a orígenes) o sk_… (solo servidor)',
    }),
  );
