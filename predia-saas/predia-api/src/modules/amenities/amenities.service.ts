import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PropertyStatus, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { LinkAmenitiesDto } from './dto/link-amenities.dto';

const AMENITY_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

const CATEGORY_AMENITY_SELECT = {
  category_id: true,
  amenity_id: true,
  amenity: { select: AMENITY_SELECT },
} as const;

const PROPERTY_AMENITY_SELECT = {
  property_id: true,
  amenity_id: true,
  amenity: { select: AMENITY_SELECT },
} as const;

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll() {
    return this.prisma.amenity.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: AMENITY_SELECT,
    });
  }

  // ─── Por categoría (catálogo del tipo de bien) ──────────────────────────────

  async addToCategory(categoryId: string, dto: LinkAmenitiesDto, caller: JwtPayload) {
    await this.assertCategoryExists(categoryId);

    const amenityIds = this.dedupe(dto.amenity_ids);
    const missing = await this.assertAmenitiesExist(amenityIds);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Las siguientes amenidades no existen o están inactivas: ${missing.join(', ')}`,
      );
    }

    await this.prisma.categoryAmenity.createMany({
      data: amenityIds.map((amenity_id) => ({
        category_id: categoryId,
        amenity_id,
      })),
      skipDuplicates: true,
    });

    this.audit('category_amenity', 'CREATE', categoryId, caller, amenityIds);

    return this.listByCategory(categoryId);
  }

  async removeFromCategory(categoryId: string, dto: LinkAmenitiesDto, caller: JwtPayload) {
    await this.assertCategoryExists(categoryId);

    const amenityIds = this.dedupe(dto.amenity_ids);

    await this.prisma.categoryAmenity.deleteMany({
      where: { category_id: categoryId, amenity_id: { in: amenityIds } },
    });

    this.audit('category_amenity', 'DELETE', categoryId, caller, amenityIds);

    return this.listByCategory(categoryId);
  }

  async findByCategory(categoryId: string) {
    await this.assertCategoryExists(categoryId);
    return this.listByCategory(categoryId);
  }

  // ─── Por propiedad (selección guardada en el bien) ──────────────────────────

  async addAmenities(
    propertyId: string,
    dto: LinkAmenitiesDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    await this.assertCanManage(propertyId, tenantId, caller);

    const amenityIds = this.dedupe(dto.amenity_ids);
    const missing = await this.assertAmenitiesExist(amenityIds);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Las siguientes amenidades no existen o están inactivas: ${missing.join(', ')}`,
      );
    }

    await this.prisma.propertyAmenity.createMany({
      data: amenityIds.map((amenity_id) => ({
        property_id: propertyId,
        amenity_id,
        tenant_id: tenantId,
      })),
      skipDuplicates: true,
    });

    this.audit('property_amenity', 'CREATE', propertyId, caller, amenityIds);

    return this.listByProperty(propertyId);
  }

  async removeAmenities(
    propertyId: string,
    dto: LinkAmenitiesDto,
    tenantId: string,
    caller: JwtPayload,
  ) {
    await this.assertCanManage(propertyId, tenantId, caller);

    const amenityIds = this.dedupe(dto.amenity_ids);

    await this.prisma.propertyAmenity.deleteMany({
      where: { property_id: propertyId, amenity_id: { in: amenityIds } },
    });

    this.audit('property_amenity', 'DELETE', propertyId, caller, amenityIds);

    return this.listByProperty(propertyId);
  }

  async findByProperty(propertyId: string, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenant_id: tenantId, status: { not: PropertyStatus.archived } },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Property no encontrada');
    }
    return this.listByProperty(propertyId);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async listByCategory(categoryId: string) {
    return this.prisma.categoryAmenity.findMany({
      where: { category_id: categoryId },
      orderBy: { amenity: { name: 'asc' } },
      select: CATEGORY_AMENITY_SELECT,
    });
  }

  private async listByProperty(propertyId: string) {
    return this.prisma.propertyAmenity.findMany({
      where: { property_id: propertyId },
      orderBy: { amenity: { name: 'asc' } },
      select: PROPERTY_AMENITY_SELECT,
    });
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  private async assertCanManage(
    propertyId: string,
    tenantId: string,
    caller: JwtPayload,
  ) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenant_id: tenantId,
        status: { not: PropertyStatus.archived },
      },
      select: { id: true, agent_id: true },
    });

    if (!property) {
      throw new NotFoundException('Property no encontrada');
    }

    if (caller.role === UserRole.agent && property.agent_id !== caller.sub) {
      throw new ForbiddenException(
        'No puedes gestionar amenidades de una property que no tienes asignada',
      );
    }

    return property;
  }

  private async assertAmenitiesExist(ids: string[]): Promise<string[]> {
    const found = await this.prisma.amenity.findMany({
      where: { id: { in: ids }, is_active: true },
      select: { id: true },
    });
    const foundIds = new Set(found.map((a) => a.id));
    return ids.filter((id) => !foundIds.has(id));
  }

  private dedupe(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  private audit(
    entity: 'category_amenity' | 'property_amenity',
    action: 'CREATE' | 'DELETE',
    entityId: string,
    caller: JwtPayload,
    amenityIds: string[],
  ): void {
    void this.auditLog
      .log({
        actor_id: caller.sub,
        actor_role: caller.role,
        action,
        entity,
        entity_id: entityId,
        payload: { amenity_ids: amenityIds },
        tenant_id: caller.tenantId,
      })
      .catch((err: unknown) => {
        this.logger.error('Audit log failed', err);
      });
  }
}