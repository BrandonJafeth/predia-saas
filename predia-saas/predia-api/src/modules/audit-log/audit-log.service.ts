import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PageOptionsDto } from 'src/common/dto/page-options.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

export interface CreateAuditLogInput {
  actor_id: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Prisma.InputJsonValue;
  tenant_id: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,           // tenant-scoped (admin ve su propio log)
    private readonly systemPrisma: SystemPrismaService, // BYPASSRLS (superadmin ve todo)
  ) {}

  // Llamado por el interceptor — siempre INSERT, nunca falla el request principal
  async log(data: CreateAuditLogInput): Promise<void> {
    await this.systemPrisma.auditLog.create({ data });
  }

  // Admin del tenant — solo ve registros de su tenant
  async findByTenant(
    tenantId: string,
    query: QueryAuditLogDto,
  ): Promise<PageDto<AuditLogResponseDto>> {
    const where = this.buildWhere({ ...query, tenant_id: tenantId });
    return this.paginate(where, query);
  }

  // Superadmin — ve todos los tenants
  async findAll(
    query: QueryAuditLogDto,
  ): Promise<PageDto<AuditLogResponseDto>> {
    const where = this.buildWhere(query);
    return this.paginateSystem(where, query);
  }

  // ─── helpers privados ───────────────────────────────────────────────────────

  private buildWhere(query: Pick<QueryAuditLogDto, 'entity' | 'action' | 'actor_id' | 'from' | 'to'> & { tenant_id?: string | null }) {
    return {
      ...(query.tenant_id !== undefined && { tenant_id: query.tenant_id }),
      ...(query.entity    && { entity:   query.entity }),
      ...(query.action    && { action:   query.action }),
      ...(query.actor_id  && { actor_id: query.actor_id }),
      ...((query.from || query.to) && {
        created_at: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to   && { lte: new Date(query.to) }),
        },
      }),
    };
  }

  private async enrich(
    rows: { actor_id: string; tenant_id: string | null }[],
  ): Promise<{
    actorMap: Map<string, { first_name: string; last_name: string; email: string }>;
    tenantMap: Map<string, { name: string; slug: string }>;
  }> {
    const actorIds = [...new Set(rows.map((r) => r.actor_id))];
    const tenantIds = [
      ...new Set(rows.map((r) => r.tenant_id).filter((id): id is string => id !== null)),
    ];

    const [actors, tenants] = await Promise.all([
      actorIds.length
        ? this.systemPrisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, first_name: true, last_name: true, email: true },
          })
        : Promise.resolve([]),
      tenantIds.length
        ? this.systemPrisma.tenant.findMany({
            where: { id: { in: tenantIds } },
            select: { id: true, name: true, slug: true },
          })
        : Promise.resolve([]),
    ]);

    return {
      actorMap: new Map(actors.map((u) => [u.id, u] as const)),
      tenantMap: new Map(tenants.map((t) => [t.id, t] as const)),
    };
  }

  private toDto(
    row: { actor_id: string; tenant_id: string | null; [key: string]: unknown },
    actorMap: Map<string, { first_name: string; last_name: string; email: string }>,
    tenantMap: Map<string, { name: string; slug: string }>,
  ): AuditLogResponseDto {
    const actor = actorMap.get(row.actor_id);
    const tenant = row.tenant_id ? tenantMap.get(row.tenant_id) : undefined;
    return {
      ...(row as unknown as AuditLogResponseDto),
      actor_name: actor ? `${actor.first_name} ${actor.last_name}` : null,
      actor_email: actor?.email ?? null,
      tenant_name: tenant?.name ?? null,
      tenant_slug: tenant?.slug ?? null,
    };
  }

  private async paginate(
    where: object,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AuditLogResponseDto>> {
    const limit = pageOptionsDto.limit ?? 20;

    const [rows, itemCount] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: pageOptionsDto.skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const { actorMap, tenantMap } = await this.enrich(rows);
    const data = rows.map((r) => this.toDto(r, actorMap, tenantMap));

    const meta = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, meta);
  }

  private async paginateSystem(
    where: object,
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<AuditLogResponseDto>> {
    const limit = pageOptionsDto.limit ?? 20;

    const [rows, itemCount] = await this.systemPrisma.$transaction([
      this.systemPrisma.auditLog.findMany({
        where,
        skip: pageOptionsDto.skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.systemPrisma.auditLog.count({ where }),
    ]);

    const { actorMap, tenantMap } = await this.enrich(rows);
    const data = rows.map((r) => this.toDto(r, actorMap, tenantMap));

    const meta = new PageMetaDto({ itemCount, pageOptionsDto });
    return new PageDto(data, meta);
  }
}