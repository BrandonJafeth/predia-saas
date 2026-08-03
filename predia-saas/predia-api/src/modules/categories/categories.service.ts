import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        amenities: {
          orderBy: { amenity: { name: 'asc' } },
          include: { amenity: true },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        amenities: {
          orderBy: { amenity: { name: 'asc' } },
          include: { amenity: true },
        },
      },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        attribute_schema: dto.attribute_schema as Prisma.InputJsonValue,
      },
      include: {
        amenities: {
          orderBy: { amenity: { name: 'asc' } },
          include: { amenity: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findById(id);
    if (dto.slug) {
      const conflict = await this.prisma.category.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);
    }
    // Prisma ignora claves `undefined` en update(): asignar directo
    // evita el spread condicional campo por campo.
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        attribute_schema: dto.attribute_schema as Prisma.InputJsonValue | undefined,
      },
      include: {
        amenities: {
          orderBy: { amenity: { name: 'asc' } },
          include: { amenity: true },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.category.delete({ where: { id } });
  }

  private async findById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }
}
