import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LookupDto } from './dto/lookup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Pre-computed hash used when the user doesn't exist so bcrypt.compare always
// runs and response time stays constant regardless of email/tenant existence.
const DUMMY_HASH =
  '$2b$12$invalidhashpadding000000000000000000000000000000000000000';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private systemPrisma: SystemPrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async lookupTenants(dto: LookupDto) {
    const MIN_MS = 400;
    const start = Date.now();

    const users = await this.systemPrisma.user.findMany({
      where: { email: dto.email },
      select: { tenant: { select: { id: true, name: true } } },
    });

    // Timing normalization — response time stays constant regardless of whether
    // the email exists, preventing enumeration via response timing.
    const elapsed = Date.now() - start;
    if (elapsed < MIN_MS) {
      await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
    }

    return users.map((u) => u.tenant);
  }

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
    const MIN_MS = 500;
    const start = Date.now();

    const tenant = await this.systemPrisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true },
    });

    const user = tenant
      ? await this.prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenant.id}, true)`;
          return tx.user.findFirst({
            where: { email: dto.email, tenant_id: tenant.id },
          });
        })
      : null;

    // Always run bcrypt to normalize response time regardless of whether the
    // user or tenant exists — prevents email/tenant enumeration via timing.
    const passwordValid =
      user != null
        ? await bcrypt.compare(dto.password, user.password_hash)
        : await bcrypt.compare(dto.password, DUMMY_HASH);

    const elapsed = Date.now() - start;
    if (elapsed < MIN_MS) {
      await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
    }

    if (!tenant || !user || !passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens({
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
    });
  }

  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Fetch fresh user data — picks up role changes since last login
    const user = await this.systemPrisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, tenant_id: true },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return this.generateTokens({
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });
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
    const secret =
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      this.config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET is not configured. Set it in your environment variables.',
      );
    }
    return secret;
  }
}
