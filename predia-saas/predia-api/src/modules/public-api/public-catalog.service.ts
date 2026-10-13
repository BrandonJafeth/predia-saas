import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import type { ApiKeyContext } from '../api-keys/api-keys.service';
import { LocationsService } from '../locations/locations.service';
import type { PublicLocationNodeDto } from './dto/public-catalog.dto';

type TreeNode = Awaited<ReturnType<LocationsService['getTree']>>[number];

// Solo lo que un selector en cascada necesita (sin code, parent_id ni fechas).
function toPublicNode(node: TreeNode): PublicLocationNodeDto {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    children: node.children.map(toPublicNode),
  };
}

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemPrisma: SystemPrismaService,
    private readonly locations: LocationsService,
  ) {}

  // Catálogos globales (sin RLS).
  async categories() {
    const rows = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        slug: true,
        name: true,
        description: true,
        attribute_schema: true,
        amenities: {
          where: { amenity: { is_active: true } },
          orderBy: { amenity: { name: 'asc' } },
          select: {
            amenity: { select: { slug: true, name: true, icon: true } },
          },
        },
      },
    });
    return rows.map((c) => ({
      ...c,
      amenities: c.amenities.map((a) => a.amenity),
    }));
  }

  async locationTree(): Promise<PublicLocationNodeDto[]> {
    return (await this.locations.getTree()).map(toPublicNode);
  }

  /** Branding de la web white-label (TenantSite) de la key de tenant. */
  async site(key: ApiKeyContext) {
    const tenant = await this.systemPrisma.tenant.findUnique({
      where: { id: key.tenantId },
      select: {
        name: true,
        slug: true,
        site: {
          select: {
            is_active: true,
            custom_domain: true,
            logo_url: true,
            primary_color: true,
            secondary_color: true,
            font_family: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Inmobiliaria no encontrada');
    const site = tenant.site?.is_active ? tenant.site : null;
    return {
      name: tenant.name,
      slug: tenant.slug,
      branding: site
        ? {
            custom_domain: site.custom_domain,
            logo_url: site.logo_url,
            primary_color: site.primary_color,
            secondary_color: site.secondary_color,
            font_family: site.font_family,
          }
        : null,
    };
  }
}
