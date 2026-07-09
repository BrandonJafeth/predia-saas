import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LeadStatus } from '@prisma/client';
import type { Request } from 'express';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  LEAD_VISIBILITY_KEY,
  LeadVisibilityOptions,
} from '../decorators/require-lead-visibility.decorator';
import { LeadVisibilityService } from '../lead-visibility.service';

type LeadVisibilityRequest = Request & {
  user?: JwtPayload;
  params: Record<string, string | undefined>;
};

@Injectable()
export class LeadVisibilityGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly leadVisibility: LeadVisibilityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<LeadVisibilityOptions>(
      LEAD_VISIBILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest<LeadVisibilityRequest>();
    const caller = request.user;
    const leadId = request.params[options.leadIdParam];

    if (!caller || !leadId) {
      throw new NotFoundException('Lead no encontrado');
    }

    // Los Guards corren antes que los Interceptors en NestJS, así que
    // TenantInterceptor todavía no fijó el contexto de tenant (ni el ALS
    // ni, por lo tanto, app.current_tenant_id vía PrismaService). Sin eso,
    // RLS filtra todas las filas y esta consulta siempre devolvería null.
    // Fijamos el tenant nosotros mismos, en la misma transacción, igual que
    // hace PrismaService para las queries que sí pasan por el interceptor.
    const [, lead] = await this.prisma.$transaction([
      this.prisma.$executeRaw`SELECT set_config('app.current_tenant_id', ${caller.tenantId}, true)`,
      this.prisma.lead.findFirst({
        where: {
          id: leadId,
          tenant_id: caller.tenantId,
          AND: [
            { status: { not: LeadStatus.archived } },
            this.leadVisibility.getVisibleLeadWhere(caller),
          ],
        },
        select: { id: true },
      }),
    ]);

    if (!lead) {
      throw new NotFoundException('Lead no encontrado');
    }

    return true;
  }
}
