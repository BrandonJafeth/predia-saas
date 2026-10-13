import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiKeyScope } from '@prisma/client';
import { tenantStore } from '../als/tenant.store';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import type { ApiKeyRequest } from '../guards/api-key.guard';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<ApiKeyRequest & { user?: JwtPayload }>();
    const user = request.user;
    // API pública: una key de scope tenant fija el tenant igual que un JWT
    // (RLS aplica). Las keys de portal NO: cruzan tenants a propósito y su
    // servicio filtra explícitamente con SystemPrismaService.
    const apiKeyTenant =
      request.apiKey?.scope === ApiKeyScope.tenant ? request.apiKey.tenantId : undefined;
    const tenantId = user?.tenantId ?? apiKeyTenant;

    if (tenantId) {
      return tenantStore.run({ tenantId }, () => {
        return next.handle();
      });
    }

    return next.handle();
  }
}
