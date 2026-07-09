import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { PropertyStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CloudinaryService } from './cloudinary.service';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const PROPERTY_IMAGE_SELECT = {
  id: true,
  property_id: true,
  url: true,
  public_id: true,
  position: true,
  is_cover: true,
  created_at: true,
} as const;

@Injectable()
export class PropertyImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async create(
    propertyId: string,
    tenantId: string,
    caller: JwtPayload,
    file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo (campo "file")');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `Tipo de archivo no permitido: "${file.mimetype}". Solo se aceptan jpg, png o webp`,
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `El archivo excede el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB)`,
      );
    }

    const property = await this.assertCanManageImages(propertyId, tenantId, caller);

    const [imageCount, maxPosition] = await Promise.all([
      this.prisma.propertyImage.count({ where: { property_id: propertyId } }),
      this.prisma.propertyImage.aggregate({
        where: { property_id: propertyId },
        _max: { position: true },
      }),
    ]);

    if (imageCount >= property.tenant.max_images_per_property) {
      throw new ForbiddenException(
        `Alcanzaste el límite de ${property.tenant.max_images_per_property} imágenes por property de tu plan`,
      );
    }

    const publicId = randomUUID();
    const folder = `predia/${tenantId}/${propertyId}`;
    const uploadResult = await this.cloudinary.upload(file.buffer, folder, publicId);

    return this.prisma.propertyImage.create({
      data: {
        property_id: propertyId,
        tenant_id: tenantId,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        position: (maxPosition._max.position ?? -1) + 1,
        is_cover: false,
      },
      select: PROPERTY_IMAGE_SELECT,
    });
  }

  async remove(
    propertyId: string,
    imageId: string,
    tenantId: string,
    caller: JwtPayload,
  ): Promise<void> {
    await this.assertCanManageImages(propertyId, tenantId, caller);

    const image = await this.prisma.propertyImage.findFirst({
      where: { id: imageId, property_id: propertyId, tenant_id: tenantId },
      select: { id: true, public_id: true },
    });

    if (!image) {
      throw new NotFoundException('Imagen no encontrada');
    }

    await this.cloudinary.destroy(image.public_id);
    await this.prisma.propertyImage.delete({ where: { id: image.id } });
  }

  private async assertCanManageImages(
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
      select: {
        id: true,
        agent_id: true,
        tenant: { select: { max_images_per_property: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Property no encontrada');
    }

    if (caller.role === UserRole.agent && property.agent_id !== caller.sub) {
      throw new ForbiddenException(
        'No puedes gestionar imágenes de una property que no tienes asignada',
      );
    }

    return property;
  }
}
