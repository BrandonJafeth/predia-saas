import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  // Solo en el refresh token: id de la AuthSession que lo respalda.
  sid?: string;
}
