import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyCode, Prisma, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FindPropertiesDto } from './dto/find-properties.dto';

const PROPERTY_SELECT = {
  id: true,
  tenant_id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  operation_type: true,
  status: true,
  currency: true,
  subtype: true,
  lot_area_m2: true,
  built_area_m2: true,
  address: true,
  lat: true,
  lng: true,
  location_id: true,
  category_id: true,
  agent_id: true,
  attributes: true,
  is_published: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.PropertySelect;

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: FindPropertiesDto, tenantId: string) {
    const where: Prisma.PropertyWhereInput = {
      tenant_id: tenantId,
      ...(filters.operation_type !== undefined && { operation_type: filters.operation_type }),
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.currency !== undefined && { currency: filters.currency }),
      ...(filters.subtype !== undefined && { subtype: filters.subtype }),
      ...(filters.location_id !== undefined && { location_id: filters.location_id }),
      ...(filters.price_min !== undefined || filters.price_max !== undefined
        ? {
            price: {
              ...(filters.price_min !== undefined && { gte: filters.price_min }),
              ...(filters.price_max !== undefined && { lte: filters.price_max }),
            },
          }
        : {}),
      ...(filters.lot_area_min !== undefined || filters.lot_area_max !== undefined
        ? {
            lot_area_m2: {
              ...(filters.lot_area_min !== undefined && { gte: filters.lot_area_min }),
              ...(filters.lot_area_max !== undefined && { lte: filters.lot_area_max }),
            },
          }
        : {}),
      ...(filters.built_area_min !== undefined || filters.built_area_max !== undefined
        ? {
            built_area_m2: {
              ...(filters.built_area_min !== undefined && { gte: filters.built_area_min }),
              ...(filters.built_area_max !== undefined && { lte: filters.built_area_max }),
            },
          }
        : {}),
    };

    const sortField = filters.sort_by ?? 'created_at';
    const sortOrder = filters.order ?? 'desc';
    const orderBy: Prisma.PropertyOrderByWithRelationInput = { [sortField]: sortOrder };

    const [items, itemCount] = await Promise.all([
      this.prisma.property.findMany({
        where,
        select: PROPERTY_SELECT,
        orderBy,
        skip: filters.skip,
        take: filters.limit ?? 10,
      }),
      this.prisma.property.count({ where }),
    ]);

    const meta = new PageMetaDto({ pageOptionsDto: filters, itemCount });
    return new PageDto(items, meta);
  }

  async create(dto: CreatePropertyDto, tenantId: string, caller: JwtPayload) {
    const agentId = await this.resolveAgentId(dto, tenantId, caller);
    const baseSlug = this.generateSlug(dto.title);
    const slug = await this.resolveSlug(baseSlug, tenantId);

    const data: Prisma.PropertyCreateInput = {
      tenant: { connect: { id: tenantId } },
      title: dto.title,
      slug,
      description: dto.description ?? null,
      price: dto.price,
      operation_type: dto.operation_type,
      currency: dto.currency ?? CurrencyCode.CRC,
      subtype: dto.subtype ?? null,
      lot_area_m2: dto.lot_area_m2 ?? null,
      built_area_m2: dto.built_area_m2 ?? null,
      address: dto.address ?? null,
      lat: dto.lat ?? null,
      lng: dto.lng ?? null,
      location: dto.location_id ? { connect: { id: dto.location_id } } : undefined,
      category: { connect: { id: dto.category_id } },
      agent: agentId ? { connect: { id: agentId } } : undefined,
      attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
      is_published: dto.is_published ?? false,
    };

    try {
      return await this.prisma.property.create({ data, select: PROPERTY_SELECT });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        data.slug = `${slug}-${Date.now()}`;
        return this.prisma.property.create({ data, select: PROPERTY_SELECT });
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'category_id o location_id no existen en la base de datos',
        );
      }
      throw error;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async resolveAgentId(
    dto: CreatePropertyDto,
    tenantId: string,
    caller: JwtPayload,
  ): Promise<string | null> {
    if (caller.role === UserRole.agent) {
      return caller.sub;
    }

    if (caller.role === UserRole.admin && dto.agent_id) {
      const agent = await this.prisma.user.findFirst({
        where: { id: dto.agent_id, tenant_id: tenantId },
        select: { id: true },
      });
      if (!agent) {
        throw new ForbiddenException(
          'El agente indicado no pertenece a esta inmobiliaria',
        );
      }
      return agent.id;
    }

    return null;
  }

  private generateSlug(title: string): string {
    const slug = title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || 'property';
  }

  private async resolveSlug(baseSlug: string, tenantId: string): Promise<string> {
    const existing = await this.prisma.property.findMany({
      where: { tenant_id: tenantId, slug: { startsWith: baseSlug } },
      select: { slug: true },
    });

    const slugSet = new Set(existing.map((p) => p.slug));
    if (!slugSet.has(baseSlug)) return baseSlug;

    let suffix = 1;
    while (slugSet.has(`${baseSlug}-${suffix}`)) suffix++;
    return `${baseSlug}-${suffix}`;
  }
}
