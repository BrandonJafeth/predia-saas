import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Prisma } from '@prisma/client';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';
import { AUDIT_LOG_KEY, AuditLogMetadata } from '../decorators/audit-log.decorator';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

interface AuditRequest {
  user?: JwtPayload;
  params: Record<string, string>;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditLogMetadata>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest<AuditRequest>();
    const user = request.user;

    return next.handle().pipe(
      tap((responseData: Record<string, unknown> | null | undefined) => {
        void this.auditLogService.log({
          actor_id: user?.sub ?? 'system',
          actor_role: user?.role ?? 'system',
          action: metadata.action,
          entity: metadata.entity,
          entity_id: responseData?.['id'] as string ?? request.params?.['id'] ?? 'unknown',
          payload: { after: (responseData ?? null) } as Prisma.InputJsonValue,
          tenant_id: user?.tenantId ?? null,
        });
      }),
    );
  }
}