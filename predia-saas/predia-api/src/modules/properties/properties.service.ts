import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyCode, Prisma, PropertyStatus, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { AttributeValidationService } from './attribute-validation.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FindPropertiesDto } from './dto/find-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

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

const PROPERTY_DETAIL_SELECT = {
  ...PROPERTY_SELECT,
  location: {
    select: { id: true, name: true, code: true, type: true, parent_id: true },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      attribute_schema: true,
      created_at: true,
      updated_at: true,
    },
  },
  agent: {
    select: { id: true, first_name: true, last_name: true, email: true },
  },
  images: {
    select: { id: true, url: true, position: true, is_cover: true, created_at: true },
    orderBy: { position: 'asc' },
  },
} satisfies Prisma.PropertySelect;

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private attributeValidation: AttributeValidationService,
  ) {}

  async findAll(filters: FindPropertiesDto, tenantId: string) {
    const where: Prisma.PropertyWhereInput = {
      tenant_id: tenantId,
      ...(filters.operation_type !== undefined && { operation_type: filters.operation_type }),
      // archived = soft-deleted: nunca aparece en el listado, ni filtrando por status explícitamente
      status: {
        not: PropertyStatus.archived,
        ...(filters.status !== undefined && { equals: filters.status }),
      },
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
        take: filters.limit ?? 20,
      }),
      this.prisma.property.count({ where }),
    ]);

    const meta = new PageMetaDto({ pageOptionsDto: filters, itemCount });
    return new PageDto(items, meta);
  }

  async create(dto: CreatePropertyDto, tenantId: string, caller: JwtPayload) {
    const agentId = await this.resolveAgentId(dto, tenantId, caller);
    await this.assertValidAttributes(dto.category_id, dto.attributes ?? {});
    const baseSlug = this.generateSlug(dto.title);

    const data: Prisma.PropertyCreateInput = {
      tenant: { connect: { id: tenantId } },
      title: dto.title,
      slug: '',
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

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      data.slug = await this.resolveSlug(baseSlug, tenantId);
      try {
        return await this.prisma.property.create({ data, select: PROPERTY_SELECT });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue; // slug tomado por request concurrente: recalcula siguiente sufijo
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

    throw new ConflictException(
      'No se pudo generar un slug único para esta property, intenta de nuevo',
    );
  }

  async update(
    id: string,
    dto: UpdatePropertyDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const existing = await this.prisma.property.findFirst({
      where: { id, tenant_id: tenantId },
      select: {
        id: true,
        title: true,
        agent_id: true,
        category_id: true,
        attributes: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Property no encontrada');
    }

    if (caller.role === UserRole.agent && existing.agent_id !== caller.sub) {
      throw new ForbiddenException(
        'No puedes editar una property que no tienes asignada',
      );
    }

    if (dto.category_id !== undefined || dto.attributes !== undefined) {
      await this.assertValidAttributes(
        dto.category_id ?? existing.category_id,
        (dto.attributes ?? existing.attributes) as Record<string, unknown>,
      );
    }

    // Prisma ignora claves `undefined` en update() (a diferencia de `null`,
    // que sí limpia el campo) — asignar directo evita el if-por-campo.
    const data: Prisma.PropertyUpdateInput = {
      title: dto.title,
      description: dto.description,
      price: dto.price,
      operation_type: dto.operation_type,
      currency: dto.currency,
      subtype: dto.subtype,
      lot_area_m2: dto.lot_area_m2,
      built_area_m2: dto.built_area_m2,
      address: dto.address,
      lat: dto.lat,
      lng: dto.lng,
      is_published: dto.is_published,
      attributes: dto.attributes as Prisma.InputJsonValue | undefined,
      category: dto.category_id ? { connect: { id: dto.category_id } } : undefined,
      location: this.toRelationUpdate(dto.location_id),
    };

    if (caller.role === UserRole.admin && dto.agent_id !== undefined) {
      data.agent = dto.agent_id
        ? { connect: { id: await this.assertAgentInTenant(dto.agent_id, tenantId) } }
        : { disconnect: true };
    }

    const titleChanged = dto.title !== undefined && dto.title !== existing.title;
    const baseSlug = titleChanged ? this.generateSlug(dto.title!) : null;

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (baseSlug !== null) {
        data.slug = await this.resolveSlug(baseSlug, tenantId, id);
      }
      try {
        return await this.prisma.property.update({
          where: { id },
          data,
          select: PROPERTY_SELECT,
        });
      } catch (error) {
        if (
          baseSlug !== null &&
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue; // slug tomado por request concurrente: recalcula siguiente sufijo
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

    throw new ConflictException(
      'No se pudo generar un slug único para esta property, intenta de nuevo',
    );
  }

  async findById(id: string, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenant_id: tenantId, status: { not: PropertyStatus.archived } },
      select: PROPERTY_DETAIL_SELECT,
    });

    if (!property) {
      throw new NotFoundException('Property no encontrada');
    }

    return property;
  }

  async findBySlug(slug: string, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { slug, tenant_id: tenantId, status: { not: PropertyStatus.archived } },
      select: PROPERTY_DETAIL_SELECT,
    });

    if (!property) {
      throw new NotFoundException('Property no encontrada');
    }

    return property;
  }

  async remove(id: string, tenantId: string, caller: JwtPayload): Promise<void> {
    const existing = await this.prisma.property.findFirst({
      where: { id, tenant_id: tenantId, status: { not: PropertyStatus.archived } },
      select: { id: true, agent_id: true },
    });

    if (!existing) {
      throw new NotFoundException('Property no encontrada');
    }

    if (caller.role === UserRole.agent && existing.agent_id !== caller.sub) {
      throw new ForbiddenException(
        'No puedes eliminar una property que no tienes asignada',
      );
    }

    await this.prisma.property.update({
      where: { id },
      data: { status: PropertyStatus.archived },
      select: { id: true },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertValidAttributes(
    categoryId: string,
    attributes: Record<string, unknown>,
  ): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, attribute_schema: true },
    });

    if (!category) {
      throw new NotFoundException('category_id no existe en la base de datos');
    }

    this.attributeValidation.validate(
      attributes,
      category.attribute_schema as Record<string, unknown>,
      category.id,
    );
  }

  private async resolveAgentId(
    dto: CreatePropertyDto,
    tenantId: string,
    caller: JwtPayload,
  ): Promise<string | null> {
    if (caller.role === UserRole.agent) {
      return caller.sub;
    }

    if (caller.role === UserRole.admin && dto.agent_id) {
      return this.assertAgentInTenant(dto.agent_id, tenantId);
    }

    return null;
  }

  private async assertAgentInTenant(
    agentId: string,
    tenantId: string,
  ): Promise<string> {
    const agent = await this.prisma.user.findFirst({
      where: { id: agentId, tenant_id: tenantId },
      select: { id: true },
    });
    if (!agent) {
      throw new ForbiddenException(
        'El agente indicado no pertenece a esta inmobiliaria',
      );
    }
    return agent.id;
  }

  private toRelationUpdate(
    id: string | null | undefined,
  ): Prisma.LocationUpdateOneWithoutPropertiesNestedInput | undefined {
    if (id === undefined) return undefined;
    return id === null ? { disconnect: true } : { connect: { id } };
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

  private async resolveSlug(
    baseSlug: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<string> {
    const existing = await this.prisma.property.findMany({
      where: {
        tenant_id: tenantId,
        slug: { startsWith: baseSlug },
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { slug: true },
    });

    const slugSet = new Set(existing.map((p) => p.slug));
    if (!slugSet.has(baseSlug)) return baseSlug;

    let suffix = 1;
    while (slugSet.has(`${baseSlug}-${suffix}`)) suffix++;
    return `${baseSlug}-${suffix}`;
  }
}
