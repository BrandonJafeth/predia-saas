import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CloudinaryService } from './cloudinary.service';
import { PropertyImagesService } from './property-images.service';

const TENANT_ID = 'tenant-1';
const PROPERTY_ID = 'property-1';
const AGENT_ID = 'agent-1';

function makeCaller(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return { sub: AGENT_ID, tenantId: TENANT_ID, role: UserRole.agent, ...overrides };
}

function makeFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'photo.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    buffer: Buffer.from('fake-image-bytes'),
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
    ...overrides,
  };
}

describe('PropertyImagesService', () => {
  let service: PropertyImagesService;
  let prisma: {
    property: { findFirst: jest.Mock };
    propertyImage: {
      count: jest.Mock;
      aggregate: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let cloudinary: { upload: jest.Mock; destroy: jest.Mock };

  beforeEach(() => {
    prisma = {
      property: { findFirst: jest.fn() },
      propertyImage: {
        count: jest.fn(),
        aggregate: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    cloudinary = { upload: jest.fn(), destroy: jest.fn() };

    service = new PropertyImagesService(
      prisma as never,
      cloudinary as unknown as CloudinaryService,
    );
  });

  const mockOwnedProperty = (overrides: { agent_id?: string | null; max?: number } = {}) => {
    prisma.property.findFirst.mockResolvedValue({
      id: PROPERTY_ID,
      agent_id: overrides.agent_id ?? AGENT_ID,
      tenant: { max_images_per_property: overrides.max ?? 20 },
    });
  };

  describe('create', () => {
    it('rechaza si no llega archivo', async () => {
      await expect(
        service.create(PROPERTY_ID, TENANT_ID, makeCaller(), undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza mimetype no permitido (415)', async () => {
      await expect(
        service.create(
          PROPERTY_ID,
          TENANT_ID,
          makeCaller(),
          makeFile({ mimetype: 'application/pdf' }),
        ),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });

    it('rechaza archivo que excede el tamaño máximo', async () => {
      await expect(
        service.create(
          PROPERTY_ID,
          TENANT_ID,
          makeCaller(),
          makeFile({ size: 6 * 1024 * 1024 }),
        ),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('rechaza si la property no existe o no pertenece al tenant (404)', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.create(PROPERTY_ID, TENANT_ID, makeCaller(), makeFile()),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el agent no es el owner de la property (403)', async () => {
      mockOwnedProperty({ agent_id: 'otro-agente' });

      await expect(
        service.create(PROPERTY_ID, TENANT_ID, makeCaller(), makeFile()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si se alcanzó el límite de imágenes del plan (403)', async () => {
      mockOwnedProperty({ max: 2 });
      prisma.propertyImage.count.mockResolvedValue(2);
      prisma.propertyImage.aggregate.mockResolvedValue({ _max: { position: 1 } });

      await expect(
        service.create(PROPERTY_ID, TENANT_ID, makeCaller(), makeFile()),
      ).rejects.toThrow(ForbiddenException);
      expect(cloudinary.upload).not.toHaveBeenCalled();
    });

    it('sube a Cloudinary y guarda el registro con la siguiente position', async () => {
      mockOwnedProperty({ max: 20 });
      prisma.propertyImage.count.mockResolvedValue(2);
      prisma.propertyImage.aggregate.mockResolvedValue({ _max: { position: 1 } });
      cloudinary.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/img.jpg',
        public_id: 'predia/tenant-1/property-1/uuid-abc',
      });
      prisma.propertyImage.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'img-1', ...data }),
      );

      const result = await service.create(
        PROPERTY_ID,
        TENANT_ID,
        makeCaller(),
        makeFile(),
      );

      expect(cloudinary.upload).toHaveBeenCalledWith(
        expect.any(Buffer),
        `predia/${TENANT_ID}/${PROPERTY_ID}`,
        expect.any(String),
      );
      expect(prisma.propertyImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 2,
            is_cover: false,
            url: 'https://res.cloudinary.com/demo/image/upload/img.jpg',
            public_id: 'predia/tenant-1/property-1/uuid-abc',
          }),
        }),
      );
      expect(result).toMatchObject({ position: 2, is_cover: false });
    });

    it('la primera imagen de la property se guarda como portada', async () => {
      mockOwnedProperty({ max: 20 });
      prisma.propertyImage.count.mockResolvedValue(0);
      prisma.propertyImage.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      cloudinary.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/first.jpg',
        public_id: 'predia/tenant-1/property-1/uuid-first',
      });
      prisma.propertyImage.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'img-1', ...data }),
      );

      const result = await service.create(
        PROPERTY_ID,
        TENANT_ID,
        makeCaller(),
        makeFile(),
      );

      expect(prisma.propertyImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            position: 0,
            is_cover: true,
          }),
        }),
      );
      expect(result).toMatchObject({ position: 0, is_cover: true });
    });

    it('admin puede subir imágenes aunque la property no tenga agente asignado', async () => {
      mockOwnedProperty({ agent_id: null, max: 20 });
      prisma.propertyImage.count.mockResolvedValue(0);
      prisma.propertyImage.aggregate.mockResolvedValue({ _max: { position: null } });
      cloudinary.upload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/first.jpg',
        public_id: 'predia/tenant-1/property-1/uuid-first',
      });
      prisma.propertyImage.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'img-1', ...data }),
      );

      const result = await service.create(
        PROPERTY_ID,
        TENANT_ID,
        makeCaller({ role: UserRole.admin, sub: 'admin-1' }),
        makeFile(),
      );

      expect(result).toMatchObject({ position: 0, is_cover: true });
    });
  });

  describe('remove', () => {
    it('rechaza si la property no pertenece al tenant (404)', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller()),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el agent no es el owner (403)', async () => {
      mockOwnedProperty({ agent_id: 'otro-agente' });

      await expect(
        service.remove(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si la imagen no existe (404)', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(PROPERTY_ID, 'img-inexistente', TENANT_ID, makeCaller()),
      ).rejects.toThrow(NotFoundException);
      expect(cloudinary.destroy).not.toHaveBeenCalled();
    });

    it('llama a cloudinary.destroy(public_id) y borra el registro', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst.mockResolvedValue({
        id: 'img-1',
        public_id: 'predia/tenant-1/property-1/uuid-abc',
        is_cover: false,
      });

      await service.remove(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller());

      expect(cloudinary.destroy).toHaveBeenCalledWith(
        'predia/tenant-1/property-1/uuid-abc',
      );
      expect(prisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('si se elimina la portada, promueve la primera imagen restante como cover', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst
        .mockResolvedValueOnce({
          id: 'img-1',
          public_id: 'predia/tenant-1/property-1/uuid-cover',
          is_cover: true,
        })
        .mockResolvedValueOnce({ id: 'img-2' });
      prisma.propertyImage.updateMany.mockResolvedValue({ count: 1 });
      prisma.propertyImage.update.mockResolvedValue({
        id: 'img-2',
        is_cover: true,
      });

      await service.remove(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller());

      expect(cloudinary.destroy).toHaveBeenCalledTimes(1);
      expect(prisma.propertyImage.delete).toHaveBeenCalledWith({
        where: { id: 'img-1' },
      });
      // usa la primera por position y la marca como cover dentro de una transacción
      expect(prisma.propertyImage.findFirst).toHaveBeenLastCalledWith({
        where: { property_id: PROPERTY_ID },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.propertyImage.updateMany).toHaveBeenCalledWith({
        where: { property_id: PROPERTY_ID, is_cover: true },
        data: { is_cover: false },
      });
      expect(prisma.propertyImage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'img-2' },
          data: { is_cover: true },
        }),
      );
    });
  });

  describe('setCover', () => {
    it('rechaza si la property no pertenece al tenant (404)', async () => {
      prisma.property.findFirst.mockResolvedValue(null);

      await expect(
        service.setCover(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller()),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el agent no es el owner (403)', async () => {
      mockOwnedProperty({ agent_id: 'otro-agente' });

      await expect(
        service.setCover(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rechaza si la imagen no existe o no pertenece a la property/tenant (404)', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst.mockResolvedValue(null);

      await expect(
        service.setCover(PROPERTY_ID, 'img-inexistente', TENANT_ID, makeCaller()),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('desmarca la cover anterior y marca la nueva dentro de una transacción', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst.mockResolvedValue({ id: 'img-2', is_cover: false });
      prisma.propertyImage.updateMany.mockResolvedValue({ count: 1 });
      prisma.propertyImage.update.mockResolvedValue({
        id: 'img-2',
        property_id: PROPERTY_ID,
        is_cover: true,
      });

      const result = await service.setCover(PROPERTY_ID, 'img-2', TENANT_ID, makeCaller());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.propertyImage.updateMany).toHaveBeenCalledWith({
        where: { property_id: PROPERTY_ID, is_cover: true },
        data: { is_cover: false },
      });
      expect(prisma.propertyImage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'img-2' },
          data: { is_cover: true },
        }),
      );
      expect(result).toMatchObject({ id: 'img-2', is_cover: true });
    });

    it('es idempotente: si la imagen ya es cover, no dispara la transacción', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findFirst.mockResolvedValue({
        id: 'img-1',
        property_id: PROPERTY_ID,
        is_cover: true,
      });

      const result = await service.setCover(PROPERTY_ID, 'img-1', TENANT_ID, makeCaller());

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.propertyImage.updateMany).not.toHaveBeenCalled();
      expect(result).toMatchObject({ id: 'img-1', is_cover: true });
    });
  });

  describe('reorder', () => {
    it('rechaza si no se envían todas las imágenes de la propiedad (400)', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findMany.mockResolvedValue([{ id: 'img-1' }, { id: 'img-2' }]);

      await expect(
        service.reorder(
          PROPERTY_ID,
          { items: [{ id: 'img-1', position: 0 }] },
          TENANT_ID,
          makeCaller(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('actualiza posiciones y marca como portada la imagen que pasa a la primera posición', async () => {
      mockOwnedProperty();
      prisma.propertyImage.findMany.mockResolvedValue([
        { id: 'img-1' },
        { id: 'img-2' },
        { id: 'img-3' },
      ]);
      prisma.propertyImage.update.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'img-x', ...data }),
      );

      await service.reorder(
        PROPERTY_ID,
        {
          items: [
            { id: 'img-2', position: 0 },
            { id: 'img-1', position: 1 },
            { id: 'img-3', position: 2 },
          ],
        },
        TENANT_ID,
        makeCaller(),
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const updateCalls = prisma.propertyImage.update.mock.calls.map((c) => c[0]);
      expect(updateCalls).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            where: { id: 'img-2' },
            data: { position: 0, is_cover: true },
          }),
          expect.objectContaining({
            where: { id: 'img-1' },
            data: { position: 1, is_cover: false },
          }),
          expect.objectContaining({
            where: { id: 'img-3' },
            data: { position: 2, is_cover: false },
          }),
        ]),
      );
    });
  });
});
