import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ApiKeyContext } from 'src/modules/api-keys/api-keys.service';
import type { ApiKeyRequest } from '../guards/api-key.guard';

/** Key resuelta por ApiKeyGuard (tenant, scope, tipo). */
export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyContext => {
    const request = ctx.switchToHttp().getRequest<ApiKeyRequest>();
    return request.apiKey as ApiKeyContext;
  },
);
