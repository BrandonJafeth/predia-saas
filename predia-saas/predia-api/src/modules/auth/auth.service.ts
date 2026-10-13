import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { EmailService } from 'src/modules/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LookupDto } from './dto/lookup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Pre-computed hash used when the user doesn't exist so bcrypt.compare always
// runs and response time stays constant regardless of email/tenant existence.
const DUMMY_HASH =
  '$2b$12$invalidhashpadding000000000000000000000000000000000000000';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private systemPrisma: SystemPrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Organizaciones donde estas credenciales son válidas. Antes solo pedía el
   * email y devolvía en qué inmobiliarias existía (enumeración de cuentas);
   * ahora exige la contraseña y solo lista los tenants donde coincide.
   */
  async lookupTenants(dto: LookupDto) {
    const MIN_MS = 500;
    const start = Date.now();

    const users = await this.systemPrisma.user.findMany({
      where: {
        email: { equals: dto.email, mode: 'insensitive' },
        status: UserStatus.active,
      },
      select: {
        password_hash: true,
        tenant: { select: { id: true, name: true } },
      },
    });

    // En paralelo (threadpool de bcrypt) y con un hash dummy si no hay
    // usuarios, para que el tiempo no dependa de si el email existe.
    const checks = await Promise.all(
      users.length > 0
        ? users.map((u) => bcrypt.compare(dto.password, u.password_hash))
        : [bcrypt.compare(dto.password, DUMMY_HASH)],
    );
    const tenants = users.filter((_, i) => checks[i]).map((u) => u.tenant);

    const elapsed = Date.now() - start;
    if (elapsed < MIN_MS) {
      await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
    }

    return tenants;
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

      const tokens = await this.createSessionTokens({
        sub: user.id,
        tenantId: tenant.id,
        role: user.role,
      });

      const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:5173';
      void this.email.sendWelcome(user.email, {
        firstName: user.first_name,
        tenantName: tenant.name,
        appUrl,
      });

      return tokens;
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
            where: {
              email: { equals: dto.email, mode: 'insensitive' },
              tenant_id: tenant.id,
            },
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

    // Solo `active` entra: suspended, deactivated e invited quedan afuera.
    if (!tenant || !user || !passwordValid || user.status !== UserStatus.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.createSessionTokens({
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

    // Refresh tokens emitidos antes de las sesiones no traen sid: se rechazan
    // (el usuario vuelve a iniciar sesión una vez).
    if (!payload.sid) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Fetch fresh user data — picks up role changes since last login
    const session = await this.systemPrisma.authSession.findUnique({
      where: { id: payload.sid },
      select: {
        id: true,
        user_id: true,
        expires_at: true,
        revoked_at: true,
        user: { select: { id: true, role: true, tenant_id: true, status: true } },
      },
    });
    if (
      !session ||
      session.user_id !== payload.sub ||
      session.revoked_at !== null ||
      session.expires_at < new Date() ||
      session.user.status !== UserStatus.active
    ) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Expiración deslizante: cada refresh extiende la sesión otros 7 días.
    await this.systemPrisma.authSession.update({
      where: { id: session.id },
      data: { expires_at: new Date(Date.now() + SESSION_TTL_MS) },
    });

    return this.generateTokens(
      {
        sub: session.user.id,
        tenantId: session.user.tenant_id,
        role: session.user.role,
      },
      session.id,
    );
  }

  /**
   * Revoca la sesión del refresh token (si es válido). Nunca falla: el logout
   * siempre limpia la cookie aunque el token esté vencido o sea basura.
   */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
      if (!payload.sid) return;
      await this.systemPrisma.authSession.updateMany({
        where: { id: payload.sid, user_id: payload.sub, revoked_at: null },
        data: { revoked_at: new Date() },
      });
    } catch {
      // token inválido/expirado: no hay sesión que revocar
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const MIN_MS = 400;
    const start = Date.now();

    try {
      const users = await this.systemPrisma.user.findMany({
        where: { email: { equals: dto.email, mode: 'insensitive' } },
        select: { id: true, email: true, first_name: true },
      });

      for (const user of users) {
        // Invalidate all existing unused tokens for this user
        await this.systemPrisma.passwordResetToken.deleteMany({
          where: { user_id: user.id, used_at: null },
        });

        const plainToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(plainToken);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await this.systemPrisma.passwordResetToken.create({
          data: { user_id: user.id, token_hash: tokenHash, expires_at: expiresAt },
        });

        const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:5173';
        void this.email.sendPasswordReset(user.email, {
          firstName: user.first_name,
          resetUrl: `${appUrl}/reset-password?token=${plainToken}`,
          expiresInMinutes: 15,
        });
      }
    } catch (err) {
      // Log but don't expose — response must be identical whether email exists or not
      this.logger.error(`forgotPassword error: ${(err as Error).message}`);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_MS) {
        await new Promise((r) => setTimeout(r, MIN_MS - elapsed));
      }
    }
  }

  async validateResetToken(token: string | undefined): Promise<{ valid: true }> {
    // Sin token, crypto.update(undefined) tiraba un TypeError → 500.
    if (!token) throw new BadRequestException('Token inválido');
    const tokenHash = this.hashToken(token);
    const record = await this.systemPrisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!record) throw new BadRequestException('Token inválido');
    if (record.used_at) throw new BadRequestException('Este enlace ya fue utilizado. Solicita uno nuevo.');
    if (record.expires_at < new Date()) throw new BadRequestException('El enlace expiró. Solicita uno nuevo.');

    return { valid: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const record = await this.systemPrisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: { select: { id: true, email: true, first_name: true } } },
    });

    if (!record) {
      throw new BadRequestException('Token inválido');
    }
    if (record.used_at) {
      throw new BadRequestException('Este enlace ya fue utilizado. Solicita uno nuevo.');
    }
    if (record.expires_at < new Date()) {
      throw new BadRequestException('El enlace expiró. Solicita uno nuevo.');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    await this.systemPrisma.$transaction([
      this.systemPrisma.user.update({
        where: { id: record.user_id },
        data: { password_hash },
      }),
      this.systemPrisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used_at: new Date() },
      }),
      // Invalidate all other tokens for this user
      this.systemPrisma.passwordResetToken.deleteMany({
        where: { user_id: record.user_id, id: { not: record.id } },
      }),
      // Cierra todas las sesiones abiertas: quien tuviera la contraseña vieja
      // (o un refresh token robado) pierde el acceso.
      this.systemPrisma.authSession.updateMany({
        where: { user_id: record.user_id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ]);

    void this.email.sendPasswordChanged(record.user.email, {
      firstName: record.user.first_name,
      changedAt: new Date(),
    });
  }

  private async createSessionTokens(payload: JwtPayload) {
    const now = new Date();
    // Limpieza oportunista de sesiones muertas del usuario.
    await this.systemPrisma.authSession.deleteMany({
      where: {
        user_id: payload.sub,
        OR: [{ expires_at: { lt: now } }, { revoked_at: { not: null } }],
      },
    });
    const session = await this.systemPrisma.authSession.create({
      data: {
        user_id: payload.sub,
        expires_at: new Date(now.getTime() + SESSION_TTL_MS),
      },
      select: { id: true },
    });
    return this.generateTokens(payload, session.id);
  }

  private generateTokens(payload: JwtPayload, sessionId: string) {
    const claims: JwtPayload = {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    };
    const accessToken = this.jwtService.sign(claims);
    const refreshToken = this.jwtService.sign(
      { ...claims, sid: sessionId },
      { expiresIn: '7d', secret: this.refreshSecret },
    );
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
