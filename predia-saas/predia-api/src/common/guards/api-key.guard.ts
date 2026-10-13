import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyScope, ApiKeyType } from '@prisma/client';
import type { Request } from 'express';
import {
  ApiKeysService,
  type ApiKeyContext,
} from 'src/modules/api-keys/api-keys.service';
import { API_KEY_SCOPES_KEY } from '../decorators/api-key-scopes.constant';

export const API_KEY_HEADER = 'x-api-key';

export type ApiKeyRequest = Request & { apiKey?: ApiKeyContext };

/**
 * Autentica la API pública (/public/v1) con X-API-Key.
 *
 * - Solo por header: una key en la URL termina en logs, historiales y
 *   cabeceras Referer (OWASP API2 / ASVS 13.1).
 * - publishable: exige un header Origin que esté en sus allowed_origins.
 *   Ojo: el Origin lo puede falsear un cliente que no sea navegador; esto
 *   impide que OTRAS webs usen la key desde el navegador de sus visitantes,
 *   no reemplaza el rate limiting ni el que la key sea de solo lectura.
 * - secret: se rechaza si llega con Origin (es decir, desde un navegador):
 *   una sk_ en el front ya está filtrada.
 * - Sin suscripción vigente → 403 (la web del cliente deja de recibir datos).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeys: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const allowedScopes = this.reflector.getAllAndOverride<ApiKeyScope[]>(
      API_KEY_SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [ApiKeyScope.tenant, ApiKeyScope.portal];

    if (
      request.query?.api_key !== undefined ||
      request.query?.apiKey !== undefined
    ) {
      throw new BadRequestException(
        'La API key va en el header X-API-Key, nunca en la URL',
      );
    }

    const raw = request.headers[API_KEY_HEADER];
    const plaintext = Array.isArray(raw) ? raw[0] : raw;
    if (!plaintext) {
      throw new UnauthorizedException('Falta la API key (header X-API-Key)');
    }

    const resolved = await this.apiKeys.resolve(plaintext.trim());
    if (!resolved.ok) {
      if (resolved.reason === 'subscription_inactive') {
        throw new ForbiddenException(
          'La suscripción asociada a esta API key no está activa',
        );
      }
      throw new UnauthorizedException('API key inválida, vencida o revocada');
    }
    const key = resolved.key;

    const origin = request.headers.origin;
    if (key.type === ApiKeyType.publishable) {
      if (!origin || !key.allowedOrigins.includes(origin)) {
        throw new ForbiddenException('Origen no permitido para esta API key');
      }
    } else if (origin) {
      throw new ForbiddenException(
        'Las API keys secretas no se pueden usar desde un navegador: usá una publishable',
      );
    }

    if (!allowedScopes.includes(key.scope)) {
      throw new ForbiddenException(
        'Esta API key no tiene acceso a este recurso',
      );
    }

    request.apiKey = key;
    return true;
  }
}
