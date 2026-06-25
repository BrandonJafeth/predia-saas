import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LocationType, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LocationNode } from './dto/location-response.dto';

const LOCATION_SELECT = {
  id: true,
  name: true,
  code: true,
  type: true,
  parent_id: true,
  created_at: true,
} satisfies Prisma.LocationSelect;

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  findProvinces() {
    return this.prisma.location.findMany({
      where: { type: LocationType.province },
      select: LOCATION_SELECT,
      orderBy: { code: 'asc' },
    });
  }

  async findChildren(id: string) {
    const parent = await this.prisma.location.findUnique({
      where: { id },
      select: { type: true },
    });

    if (!parent) throw new NotFoundException('Ubicación no encontrada');
    if (parent.type === LocationType.district) {
      throw new BadRequestException('Los distritos no tienen ubicaciones hijas');
    }

    return this.prisma.location.findMany({
      where: { parent_id: id },
      select: LOCATION_SELECT,
      orderBy: { code: 'asc' },
    });
  }

  async getTree(): Promise<LocationNode[]> {
    const all = await this.prisma.location.findMany({
      select: LOCATION_SELECT,
      orderBy: { code: 'asc' },
    });

    const nodeMap = new Map<string, LocationNode>();
    for (const loc of all) {
      const node: LocationNode = {
        id: loc.id,
        name: loc.name,
        code: loc.code,
        type: loc.type,
        parent_id: loc.parent_id,
        created_at: loc.created_at,
        children: [],
      };
      nodeMap.set(loc.id, node);
    }

    const roots: LocationNode[] = [];
    for (const loc of all) {
      const node = nodeMap.get(loc.id);
      if (!node) continue;
      if (loc.parent_id) {
        nodeMap.get(loc.parent_id)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
