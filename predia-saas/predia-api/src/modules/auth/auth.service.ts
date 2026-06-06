import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const password_hash = await bcrypt.hash(dto.password, 12);

    try {
      const { tenant, user } = await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: dto.tenantName,
            slug: dto.tenantSlug.toLowerCase().trim(),
          },
        });
        
        // Habilitamos el RLS para este tenant temporalmente en esta transacción
        // para que PostgreSQL permita insertar el usuario administrador.
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenant.id}, true)`;

        const user = await tx.user.create({
          data: {
            email: dto.email,
            first_name: dto.firstName,
            last_name: dto.lastName,
            role: UserRole.admin,
            password_hash,
            tenant_id: tenant.id,
          },
        });
        return { tenant, user };
      });

      return this.generateTokens({
        sub: user.id,
        tenantId: tenant.id,
        role: user.role,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El slug o email ya está en uso');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });
    if (!tenant) throw new NotFoundException('Inmobiliaria no encontrada');

    const user = await this.prisma.$transaction(async (tx) => {
      // Configuramos el tenant temporalmente para que RLS permita leer al usuario
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenant.id}, true)`;
      return tx.user.findFirst({
        where: { email: dto.email, tenant_id: tenant.id },
      });
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) throw new UnauthorizedException('Credenciales inválidas');

    return this.generateTokens({
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
    });
  }

  async refreshTokens(refreshToken: string) {
    const refreshSecret = this.refreshSecret;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
      return this.generateTokens({
        sub: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.refreshSecret,
    });
    return { accessToken, refreshToken };
  }

  private get refreshSecret(): string {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      this.config.get<string>('JWT_SECRET') ??
      'refresh-secret'
    );
  }
}
