import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class LeadVisibilityService {
  getVisibleLeadWhere(caller: JwtPayload): Prisma.LeadWhereInput {
    switch (caller.role) {
      case UserRole.admin:
        return {};
      case UserRole.agent:
        return { assigned_to: caller.sub };
      default:
        return { id: { equals: '__no_visible_leads__' } };
    }
  }
}
