import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiKeyScope,
  ApiKeyType,
  Prisma,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { normalizeOrigin } from './api-key-origins';
import type { CreateApiKeyDto } from './dto/create-api-key.dto';

const MAX_ACTIVE_KEYS_PER_TENANT = 10;
const ORIGINS_CACHE_TTL_MS = 60_000;
const TOUCH_INTERVAL_MS = 5 * 60_000;

const ACTIVE_SUBSCRIPTIONS: SubscriptionStatus[] = [
  SubscriptionStatus.trial,
  SubscriptionStatus.active,
];

const API_KEY_SELECT = {
  id: true,
  name: true,
  type: true,
  scope: true,
  key_prefix: true,
  allowed_origins: true,
  last_used_at: true,
  expires_at: true,
  revoked_at: true,
  created_at: true,
} satisfies Prisma.ApiKeySelect;

/** Lo que el guard deja en request.apiKey para los handlers públicos. */
export interface ApiKeyContext {
  id: string;
  type: ApiKeyType;
  scope: ApiKeyScope;
  tenantId: string;
  tenantSlug: string;
  allowedOrigins: string[];
}

export type ResolvedApiKey =
  | { ok: true; key: ApiKeyContext }
  | { ok: false; reason: 'invalid' | 'subscription_inactive' };

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);
  private originsCache: { origins: Set<string>; expiresAt: number } | null =
    null;
  private readonly lastTouch = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly systemPrisma: SystemPrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  static hash(plaintext: string): string {
    return createHash('sha256').update(plaintext).digest('hex');
  }

  // ─── Gestión desde el CRM (tenant-scoped, RLS) ──────────────────────────────

  async create(dto: CreateApiKeyDto, caller: JwtPayload) {
    // El super_admin crea las keys de la web de Predia (scope portal, en el
    // tenant del sistema); un admin, las de su web white-label.
    const scope =
      caller.role === UserRole.super_admin
        ? ApiKeyScope.portal
        : ApiKeyScope.tenant;
    const allowedOrigins = this.validateOrigins(dto.type, dto.allowed_origins);
    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('expires_at debe ser una fecha futura');
    }

    const active = await this.prisma.apiKey.count({
      where: {
        tenant_id: caller.tenantId,
        revoked_at: null,
        OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
      },
    });
    if (active >= MAX_ACTIVE_KEYS_PER_TENANT) {
      throw new ConflictException(
        `Máximo ${MAX_ACTIVE_KEYS_PER_TENANT} API keys activas: revocá alguna antes de crear otra`,
      );
    }

    const plaintext = this.generatePlaintext(dto.type);
    const key = await this.prisma.apiKey.create({
      data: {
        tenant_id: caller.tenantId,
        name: dto.name,
        type: dto.type,
        scope,
        key_prefix: plaintext.slice(0, 14),
        key_hash: ApiKeysService.hash(plaintext),
        allowed_origins: allowedOrigins,
        expires_at: expiresAt,
        created_by: caller.sub,
      },
      select: API_KEY_SELECT,
    });

    this.originsCache = null;
    // Log manual (no @AuditLog): el interceptor guardaría la respuesta, que
    // incluye la key en texto plano.
    this.audit(caller, 'CREATE', key.id, {
      name: key.name,
      type: key.type,
      scope: key.scope,
      key_prefix: key.key_prefix,
      allowed_origins: key.allowed_origins,
    });

    return { ...key, plaintext_key: plaintext };
  }

  findAll(caller: JwtPayload) {
    return this.prisma.apiKey.findMany({
      where: { tenant_id: caller.tenantId },
      orderBy: [
        { revoked_at: { sort: 'desc', nulls: 'first' } },
        { created_at: 'desc' },
      ],
      select: API_KEY_SELECT,
    });
  }

  async revoke(id: string, caller: JwtPayload) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, tenant_id: caller.tenantId },
      select: { id: true, revoked_at: true },
    });
    if (!key) throw new NotFoundException('API key no encontrada');
    if (key.revoked_at) return this.findOne(id, caller);

    const revoked = await this.prisma.apiKey.update({
      where: { id },
      data: { revoked_at: new Date() },
      select: API_KEY_SELECT,
    });
    this.originsCache = null;
    this.audit(caller, 'REVOKE', id, { key_prefix: revoked.key_prefix });
    return revoked;
  }

  private async findOne(id: string, caller: JwtPayload) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, tenant_id: caller.tenantId },
      select: API_KEY_SELECT,
    });
    if (!key) throw new NotFoundException('API key no encontrada');
    return key;
  }

  // ─── Resolución de keys entrantes (guard, sin contexto de tenant) ───────────

  async resolve(plaintext: string): Promise<ResolvedApiKey> {
    // Formato esperado: pk_/sk_ + entorno + 43 chars base64url. Descartar
    // basura antes de tocar la base.
    if (!/^(pk|sk)_(live|test)_[A-Za-z0-9_-]{43}$/.test(plaintext)) {
      return { ok: false, reason: 'invalid' };
    }
    const key = await this.systemPrisma.apiKey.findUnique({
      where: { key_hash: ApiKeysService.hash(plaintext) },
      select: {
        id: true,
        type: true,
        scope: true,
        tenant_id: true,
        allowed_origins: true,
        expires_at: true,
        revoked_at: true,
        tenant: { select: { slug: true, subscription_status: true } },
      },
    });
    if (
      !key ||
      key.revoked_at ||
      (key.expires_at && key.expires_at <= new Date())
    ) {
      return { ok: false, reason: 'invalid' };
    }
    // Sin suscripción vigente, la web del cliente deja de recibir datos.
    if (!ACTIVE_SUBSCRIPTIONS.includes(key.tenant.subscription_status)) {
      return { ok: false, reason: 'subscription_inactive' };
    }
    this.touch(key.id);
    return {
      ok: true,
      key: {
        id: key.id,
        type: key.type,
        scope: key.scope,
        tenantId: key.tenant_id,
        tenantSlug: key.tenant.slug,
        allowedOrigins: key.allowed_origins,
      },
    };
  }

  /**
   * ¿Algún key publishable activo admite este origen? Lo usa el CORS de
   * /public (el preflight no trae la key, así que se responde con el
   * conjunto de orígenes registrados; el guard valida después que el origen
   * corresponda a la key concreta).
   */
  async isRegisteredOrigin(origin: string): Promise<boolean> {
    const now = Date.now();
    if (!this.originsCache || this.originsCache.expiresAt <= now) {
      const keys = await this.systemPrisma.apiKey.findMany({
        where: {
          type: ApiKeyType.publishable,
          revoked_at: null,
          OR: [{ expires_at: null }, { expires_at: { gt: new Date() } }],
        },
        select: { allowed_origins: true },
      });
      this.originsCache = {
        origins: new Set(keys.flatMap((k) => k.allowed_origins)),
        expiresAt: now + ORIGINS_CACHE_TTL_MS,
      };
    }
    return this.originsCache.origins.has(origin);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private validateOrigins(
    type: ApiKeyType,
    origins: string[] | undefined,
  ): string[] {
    const list = origins ?? [];
    if (type === ApiKeyType.secret) {
      if (list.length > 0) {
        throw new BadRequestException(
          'Las keys secretas no llevan allowed_origins: son solo para servidor',
        );
      }
      return [];
    }
    if (list.length === 0) {
      throw new BadRequestException(
        'Una key publishable necesita al menos un origen permitido (ej. https://www.tusitio.com)',
      );
    }
    const normalized = list.map((o) => ({
      raw: o,
      origin: normalizeOrigin(o),
    }));
    const invalid = normalized
      .filter((o) => o.origin === null)
      .map((o) => o.raw);
    if (invalid.length > 0) {
      throw new BadRequestException(
        invalid.map(
          (o) =>
            `Origen inválido: "${o}". Usá https://host[:puerto] sin rutas ni comodines (http solo para localhost)`,
        ),
      );
    }
    return [...new Set(normalized.map((o) => o.origin as string))];
  }

  private generatePlaintext(type: ApiKeyType): string {
    const env =
      this.config.get<string>('NODE_ENV') === 'production' ? 'live' : 'test';
    const prefix = type === ApiKeyType.publishable ? 'pk' : 'sk';
    // 32 bytes = 256 bits → 43 caracteres base64url.
    return `${prefix}_${env}_${randomBytes(32).toString('base64url')}`;
  }

  // last_used_at con escritura espaciada: no una por request.
  private touch(id: string) {
    const now = Date.now();
    if ((this.lastTouch.get(id) ?? 0) > now - TOUCH_INTERVAL_MS) return;
    this.lastTouch.set(id, now);
    void this.systemPrisma.apiKey
      .update({ where: { id }, data: { last_used_at: new Date(now) } })
      .catch((err: unknown) =>
        this.logger.warn(`No se pudo actualizar last_used_at: ${String(err)}`),
      );
  }

  private audit(
    caller: JwtPayload,
    action: 'CREATE' | 'REVOKE',
    entityId: string,
    payload: Prisma.InputJsonValue,
  ) {
    void this.auditLog
      .log({
        actor_id: caller.sub,
        actor_role: caller.role,
        action,
        entity: 'api_key',
        entity_id: entityId,
        payload,
        tenant_id: caller.tenantId,
      })
      .catch((err: unknown) => this.logger.error('Audit log failed', err));
  }
}
