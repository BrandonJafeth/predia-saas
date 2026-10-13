import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiKeyScope,
  Prisma,
  PropertyStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PageDto } from 'src/common/dto/page.dto';
import { PageMetaDto } from 'src/common/dto/page-meta.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemPrismaService } from 'src/prisma/system-prisma.service';
import type { ApiKeyContext } from '../api-keys/api-keys.service';
import type {
  PublicPropertiesQueryDto,
  PublicPropertyDetailQueryDto,
} from './dto/public-properties-query.dto';

const ACTIVE_SUBSCRIPTIONS: SubscriptionStatus[] = [
  SubscriptionStatus.trial,
  SubscriptionStatus.active,
];

const LOCATION_SELECT = {
  id: true,
  name: true,
  type: true,
  parent: { select: { name: true, parent: { select: { name: true } } } },
} satisfies Prisma.LocationSelect;

const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  operation_type: true,
  currency: true,
  price: true,
  subtype: true,
  lot_area_m2: true,
  built_area_m2: true,
  created_at: true,
  location: { select: LOCATION_SELECT },
  category: { select: { slug: true, name: true } },
  tenant: { select: { name: true, slug: true } },
  images: {
    where: { is_cover: true },
    take: 1,
    select: { url: true, position: true, is_cover: true },
  },
} satisfies Prisma.PropertySelect;

const DETAIL_SELECT = {
  ...LIST_SELECT,
  description: true,
  address: true,
  lat: true,
  lng: true,
  attributes: true,
  category: { select: { slug: true, name: true, attribute_schema: true } },
  images: {
    orderBy: { position: 'asc' },
    select: { url: true, position: true, is_cover: true },
  },
  amenities: {
    where: { amenity: { is_active: true } },
    orderBy: { amenity: { name: 'asc' } },
    select: { amenity: { select: { slug: true, name: true, icon: true } } },
  },
  agent: { select: { first_name: true, last_name: true } },
} satisfies Prisma.PropertySelect;

type ListRow = Prisma.PropertyGetPayload<{ select: typeof LIST_SELECT }>;
type DetailRow = Prisma.PropertyGetPayload<{ select: typeof DETAIL_SELECT }>;

/**
 * Lectura pública de propiedades.
 * - Key de tenant: PrismaService con el tenant fijado por TenantInterceptor
 *   (RLS) y además tenant_id explícito en el where.
 * - Key de portal: SystemPrismaService (cruza tenants a propósito) filtrando
 *   explícitamente publicadas + activas + suscripción vigente.
 * En ambos casos solo is_published && status = active.
 */
@Injectable()
export class PublicPropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemPrisma: SystemPrismaService,
  ) {}

  async findAll(query: PublicPropertiesQueryDto, key: ApiKeyContext) {
    const where: Prisma.PropertyWhereInput = {
      ...this.visibilityWhere(key, query.tenant),
      ...(query.operation_type && { operation_type: query.operation_type }),
      ...(query.currency && { currency: query.currency }),
      ...(query.category && { category: { slug: query.category } }),
      ...(query.location_id && {
        location: {
          OR: [
            { id: query.location_id },
            { parent_id: query.location_id },
            { parent: { parent_id: query.location_id } },
          ],
        },
      }),
      ...((query.price_min !== undefined || query.price_max !== undefined) && {
        price: {
          ...(query.price_min !== undefined && { gte: query.price_min }),
          ...(query.price_max !== undefined && { lte: query.price_max }),
        },
      }),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
      query.sort === 'price_asc'
        ? [{ price: 'asc' }, { id: 'asc' }]
        : query.sort === 'price_desc'
          ? [{ price: 'desc' }, { id: 'asc' }]
          : [{ created_at: 'desc' }, { id: 'asc' }];

    const db = this.db(key);
    const [rows, itemCount] = await Promise.all([
      db.property.findMany({
        where,
        select: LIST_SELECT,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.property.count({ where }),
    ]);

    const meta = new PageMetaDto({
      pageOptionsDto: { page: query.page, limit: query.limit },
      itemCount,
    });
    return new PageDto(
      rows.map((row) => this.toListDto(row)),
      meta,
    );
  }

  async findBySlug(
    slug: string,
    query: PublicPropertyDetailQueryDto,
    key: ApiKeyContext,
  ) {
    if (key.scope === ApiKeyScope.portal && !query.tenant) {
      throw new BadRequestException(
        'Con una key de portal indicá la inmobiliaria (?tenant=<slug>)',
      );
    }
    const row = await this.db(key).property.findFirst({
      where: { ...this.visibilityWhere(key, query.tenant), slug },
      select: DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Propiedad no encontrada');
    return this.toDetailDto(row);
  }

  /** Para la captura de leads: propiedad visible para esta key. */
  async findVisibleForLead(
    slug: string,
    tenantSlug: string | undefined,
    key: ApiKeyContext,
  ) {
    return this.db(key).property.findFirst({
      where: { ...this.visibilityWhere(key, tenantSlug), slug },
      select: {
        id: true,
        tenant_id: true,
        agent: { select: { id: true, status: true } },
      },
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private db(key: ApiKeyContext) {
    return key.scope === ApiKeyScope.portal ? this.systemPrisma : this.prisma;
  }

  private visibilityWhere(
    key: ApiKeyContext,
    tenantSlug?: string,
  ): Prisma.PropertyWhereInput {
    const published: Prisma.PropertyWhereInput = {
      is_published: true,
      status: PropertyStatus.active,
    };
    if (key.scope === ApiKeyScope.tenant) {
      return { ...published, tenant_id: key.tenantId };
    }
    return {
      ...published,
      tenant: {
        subscription_status: { in: ACTIVE_SUBSCRIPTIONS },
        ...(tenantSlug && { slug: tenantSlug }),
      },
    };
  }

  private toListDto(row: ListRow) {
    const cover = row.images[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      operation_type: row.operation_type,
      currency: row.currency,
      price: row.price.toFixed(2),
      subtype: row.subtype,
      lot_area_m2: row.lot_area_m2?.toFixed(2) ?? null,
      built_area_m2: row.built_area_m2?.toFixed(2) ?? null,
      location: row.location ? this.toLocation(row.location) : null,
      category: { slug: row.category.slug, name: row.category.name },
      cover_image: cover ? this.toImage(cover) : null,
      agency: { name: row.tenant.name, slug: row.tenant.slug },
      listed_at: row.created_at,
    };
  }

  private toDetailDto(row: DetailRow) {
    const base = this.toListDto({
      ...row,
      images: row.images.filter((i) => i.is_cover),
    });
    return {
      ...base,
      cover_image:
        base.cover_image ??
        (row.images[0] ? this.toImage(row.images[0]) : null),
      description: row.description,
      address: row.address,
      // Ubicación aproximada (~100 m): la dirección exacta de una vivienda no
      // se publica por defecto.
      coordinates:
        row.lat !== null && row.lng !== null
          ? { lat: round3(Number(row.lat)), lng: round3(Number(row.lng)) }
          : null,
      attributes: row.attributes as Record<string, unknown>,
      category: {
        slug: row.category.slug,
        name: row.category.name,
        attribute_schema: row.category.attribute_schema as Record<
          string,
          unknown
        >,
      },
      images: row.images.map((img) => this.toImage(img)),
      amenities: row.amenities.map((a) => a.amenity),
      agent: row.agent
        ? { first_name: row.agent.first_name, last_name: row.agent.last_name }
        : null,
    };
  }

  private toLocation(loc: ListRow['location'] & object) {
    const parents = [loc.parent?.name, loc.parent?.parent?.name].filter(
      (n): n is string => Boolean(n),
    );
    return { id: loc.id, name: loc.name, type: loc.type, parents };
  }

  private toImage(img: { url: string; position: number; is_cover: boolean }) {
    return {
      url: cloudinaryVariant(img.url, 'c_limit,w_1600,q_auto,f_auto'),
      thumbnail_url: cloudinaryVariant(
        img.url,
        'c_fill,w_640,h_480,q_auto,f_auto',
      ),
      position: img.position,
      is_cover: img.is_cover,
    };
  }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Las imágenes públicas salen con tamaño acotado (no el original en alta):
 * menos peso para el visitante y menos valor para quien scrapea el catálogo.
 * URLs que no son de Cloudinary se devuelven tal cual.
 */
export function cloudinaryVariant(url: string, transformation: string): string {
  const marker = '/image/upload/';
  if (!url.startsWith('https://res.cloudinary.com/') || !url.includes(marker))
    return url;
  return url.replace(marker, `${marker}${transformation}/`);
}
