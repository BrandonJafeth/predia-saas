import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { Request } from 'express';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private systemPrisma: SystemPrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Token no proporcionado');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;

      // SystemPrismaService (BYPASSRLS) — necesario porque el guard corre antes
      // de TenantInterceptor: no hay tenantId en el ALS todavía, y RLS bloquearía
      // la consulta si se usa PrismaService (predia_app, NOBYPASSRLS).
      const user = await this.systemPrisma.user.findUnique({
        where: { id: payload.sub },
        select: { status: true },
      });

      if (!user || user.status === UserStatus.suspended) {
        throw new UnauthorizedException('Tu cuenta está suspendida');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token inválido o expirado');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
