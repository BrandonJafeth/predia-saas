import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AuditLogService } from '../audit-log/audit-log.service';
import { AmenitiesService } from './amenities.service';

const TENANT_ID = 'tenant-1';
const CATEGORY_ID = 'category-1';
const PROPERTY_ID = 'property-1';
const AGENT_ID = 'agent-1';
const AMENITY_1 = 'amenity-1';
const AMENITY_2 = 'amenity-2';

function makeCaller(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return { sub: AGENT_ID, tenantId: TENANT_ID, role: UserRole.super_admin, ...overrides };
}

describe('AmenitiesService', () => {
  let service: AmenitiesService;
  let prisma: {
    amenity: { findMany: jest.Mock };
    category: { findUnique: jest.Mock };
    categoryAmenity: { createMany: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock };
    property: { findFirst: jest.Mock };
    propertyAmenity: { createMany: jest.Mock; deleteMany: jest.Mock; findMany: jest.Mock };
  };
  let auditLog: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      amenity: { findMany: jest.fn() },
      category: { findUnique: jest.fn() },
      categoryAmenity: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      property: { findFirst: jest.fn() },
      propertyAmenity: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
    };
    auditLog = { log: jest.fn().mockResolvedValue(undefined) };

    service = new AmenitiesService(prisma as never, auditLog as unknown as AuditLogService);
  });

  const mockCategory = () => {
    prisma.category.findUnique.mockResolvedValue({ id: CATEGORY_ID });
  };

  describe('findAll', () => {
    it('devuelve solo amenidades activas ordenadas por nombre', async () => {
      prisma.amenity.findMany.mockResolvedValue([{ id: AMENITY_1, slug: 'piscina' }]);

      const result = await service.findAll();

      expect(prisma.amenity.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: { name: 'asc' },
        select: expect.any(Object),
      });
      expect(result).toEqual([{ id: AMENITY_1, slug: 'piscina' }]);
    });
  });

  describe('addToCategory', () => {
    it('rechaza si la categoría no existe (404)', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.addToCategory(CATEGORY_ID, { amenity_ids: [AMENITY_1] }, makeCaller()),
      ).rejects.toThrow(NotFoundException);
    });

    it('valida que las amenidades existan antes de asociar (400)', async () => {
      mockCategory();
      prisma.amenity.findMany.mockResolvedValue([{ id: AMENITY_1 }]);

      await expect(
        service.addToCategory(
          CATEGORY_ID,
          { amenity_ids: [AMENITY_1, 'amenity-inexistente'] },
          makeCaller(),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.categoryAmenity.createMany).not.toHaveBeenCalled();
    });

    it('deduplica ids y asocia con skipDuplicates', async () => {
      mockCategory();
      prisma.amenity.findMany.mockResolvedValue([{ id: AMENITY_1 }, { id: AMENITY_2 }]);
      prisma.categoryAmenity.createMany.mockResolvedValue({ count: 2 });
      prisma.categoryAmenity.findMany.mockResolvedValue([]);

      await service.addToCategory(
        CATEGORY_ID,
        { amenity_ids: [AMENITY_1, AMENITY_2, AMENITY_1] },
        makeCaller(),
      );

      expect(prisma.categoryAmenity.createMany).toHaveBeenCalledWith({
        data: [
          { category_id: CATEGORY_ID, amenity_id: AMENITY_1 },
          { category_id: CATEGORY_ID, amenity_id: AMENITY_2 },
        ],
        skipDuplicates: true,
      });
    });

    it('audita CREATE y devuelve el listado actualizado', async () => {
      mockCategory();
      prisma.amenity.findMany.mockResolvedValue([{ id: AMENITY_1 }]);
      prisma.categoryAmenity.createMany.mockResolvedValue({ count: 1 });
      prisma.categoryAmenity.findMany.mockResolvedValue([
        { category_id: CATEGORY_ID, amenity_id: AMENITY_1 },
      ]);

      const result = await service.addToCategory(
        CATEGORY_ID,
        { amenity_ids: [AMENITY_1] },
        makeCaller(),
      );

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity: 'category_amenity',
          entity_id: CATEGORY_ID,
          tenant_id: TENANT_ID,
        }),
      );
      expect(result).toEqual([{ category_id: CATEGORY_ID, amenity_id: AMENITY_1 }]);
    });
  });

  describe('removeFromCategory', () => {
    it('rechaza si la categoría no existe (404)', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.removeFromCategory(CATEGORY_ID, { amenity_ids: [AMENITY_1] }, makeCaller()),
      ).rejects.toThrow(NotFoundException);
    });

    it('desasocia con deleteMany (idempotente)', async () => {
      mockCategory();
      prisma.categoryAmenity.deleteMany.mockResolvedValue({ count: 0 });
      prisma.categoryAmenity.findMany.mockResolvedValue([]);

      const result = await service.removeFromCategory(
        CATEGORY_ID,
        { amenity_ids: [AMENITY_1, AMENITY_2, AMENITY_1] },
        makeCaller(),
      );

      expect(prisma.categoryAmenity.deleteMany).toHaveBeenCalledWith({
        where: { category_id: CATEGORY_ID, amenity_id: { in: [AMENITY_1, AMENITY_2] } },
      });
      expect(result).toEqual([]);
    });

    it('audita DELETE y devuelve el listado actualizado', async () => {
      mockCategory();
      prisma.categoryAmenity.deleteMany.mockResolvedValue({ count: 1 });
      prisma.categoryAmenity.findMany.mockResolvedValue([]);

      await service.removeFromCategory(
        CATEGORY_ID,
        { amenity_ids: [AMENITY_1] },
        makeCaller(),
      );

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entity: 'category_amenity',
          entity_id: CATEGORY_ID,
          tenant_id: TENANT_ID,
        }),
      );
    });
  });

  describe('addAmenities (propiedad)', () => {
    it('rechaza si la propiedad no existe (404)', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.addAmenities(
          PROPERTY_ID,
          { amenity_ids: [AMENITY_1] },
          TENANT_ID,
          makeCaller(),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('bloquea a un agente que no tiene asignada la propiedad (403)', async () => {
      prisma.property.findFirst.mockResolvedValue({
        id: PROPERTY_ID,
        agent_id: 'otro-agente',
      });

      await expect(
        service.addAmenities(
          PROPERTY_ID,
          { amenity_ids: [AMENITY_1] },
          TENANT_ID,
          makeCaller({ role: UserRole.agent }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('asocia con skipDuplicates y tenant_id', async () => {
      prisma.property.findFirst.mockResolvedValue({
        id: PROPERTY_ID,
        agent_id: AGENT_ID,
      });
      prisma.amenity.findMany.mockResolvedValue([{ id: AMENITY_1 }, { id: AMENITY_2 }]);
      prisma.propertyAmenity.createMany.mockResolvedValue({ count: 2 });
      prisma.propertyAmenity.findMany.mockResolvedValue([]);

      await service.addAmenities(
        PROPERTY_ID,
        { amenity_ids: [AMENITY_1, AMENITY_2, AMENITY_1] },
        TENANT_ID,
        makeCaller(),
      );

      expect(prisma.propertyAmenity.createMany).toHaveBeenCalledWith({
        data: [
          { property_id: PROPERTY_ID, amenity_id: AMENITY_1, tenant_id: TENANT_ID },
          { property_id: PROPERTY_ID, amenity_id: AMENITY_2, tenant_id: TENANT_ID },
        ],
        skipDuplicates: true,
      });
    });
  });

  describe('removeAmenities (propiedad)', () => {
    it('desasocia con deleteMany (idempotente)', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: PROPERTY_ID, agent_id: AGENT_ID });
      prisma.propertyAmenity.deleteMany.mockResolvedValue({ count: 0 });
      prisma.propertyAmenity.findMany.mockResolvedValue([]);

      const result = await service.removeAmenities(
        PROPERTY_ID,
        { amenity_ids: [AMENITY_1, AMENITY_2] },
        TENANT_ID,
        makeCaller(),
      );

      expect(prisma.propertyAmenity.deleteMany).toHaveBeenCalledWith({
        where: { property_id: PROPERTY_ID, amenity_id: { in: [AMENITY_1, AMENITY_2] } },
      });
      expect(result).toEqual([]);
    });

    it('audita DELETE y devuelve el listado actualizado', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: PROPERTY_ID, agent_id: AGENT_ID });
      prisma.propertyAmenity.deleteMany.mockResolvedValue({ count: 1 });
      prisma.propertyAmenity.findMany.mockResolvedValue([]);

      await service.removeAmenities(
        PROPERTY_ID,
        { amenity_ids: [AMENITY_1] },
        TENANT_ID,
        makeCaller(),
      );

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entity: 'property_amenity',
          entity_id: PROPERTY_ID,
          tenant_id: TENANT_ID,
        }),
      );
    });
  });

  describe('findByProperty (propiedad)', () => {
    it('rechaza si la propiedad no existe (404)', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.findByProperty(PROPERTY_ID, TENANT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('devuelve el listado de amenidades de la propiedad', async () => {
      prisma.property.findFirst.mockResolvedValue({ id: PROPERTY_ID });
      prisma.propertyAmenity.findMany.mockResolvedValue([
        { property_id: PROPERTY_ID, amenity_id: AMENITY_1 },
      ]);

      const result = await service.findByProperty(PROPERTY_ID, TENANT_ID);

      expect(result).toEqual([{ property_id: PROPERTY_ID, amenity_id: AMENITY_1 }]);
    });
  });
});