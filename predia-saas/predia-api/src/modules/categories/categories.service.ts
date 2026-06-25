import { Injectable, NotFoundException } from '@nestjs/common';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private systemPrisma: SystemPrismaService) {}

  findAll() {
    return this.systemPrisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.systemPrisma.category.findUnique({
      where: { slug },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }
}
