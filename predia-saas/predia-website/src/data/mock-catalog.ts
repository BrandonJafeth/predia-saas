// Datos de ejemplo con la MISMA forma que la API pública. Se usan cuando el
// build no tiene PREDIA_API_URL / PREDIA_API_SECRET_KEY (CI, desarrollo sin
// API): la web compila y se puede revisar igual, pero nunca mezcla datos
// reales con datos de ejemplo.
import type {
  Category,
  LocationNode,
  PropertyAmenity,
  PropertyDetail,
  PropertyImage,
  PropertyLocation,
  PropertySummary,
} from '../lib/types/property';
import { categories as legacyCategories } from './categories.mock';
import { getLocationById, locations as legacyLocations } from './locations.mock';
import { properties as legacyProperties } from './properties.mock';
import type { Property as LegacyProperty } from './mock-types';

const MOCK_AGENCY = { name: 'Agencia Demo', slug: 'agencia-demo' };

interface SchemaField {
  title?: string;
  enum?: (string | number)[];
  enumNames?: string[];
  items?: SchemaField;
}

function schemaProps(schema: Record<string, unknown>): Record<string, SchemaField> {
  return ((schema as { properties?: Record<string, SchemaField> }).properties ?? {});
}

function toLocation(id: string | null): PropertyLocation | null {
  const loc = id ? getLocationById(id) : undefined;
  if (!loc) return null;
  const parents: string[] = [];
  let parent = loc.parent_id ? getLocationById(loc.parent_id) : undefined;
  while (parent) {
    parents.push(parent.name);
    parent = parent.parent_id ? getLocationById(parent.parent_id) : undefined;
  }
  return { id: loc.id, name: loc.name, type: loc.type, parents };
}

function toImage(img: LegacyProperty['images'][number]): PropertyImage {
  return { url: img.url, thumbnail_url: img.url.replace('w=1200', 'w=640'), position: img.position, is_cover: img.is_cover };
}

// En la base real las amenidades viven en su propia tabla; en el mock siguen
// dentro de attributes (arrays). Se separan igual que lo hace el API.
function splitAttributes(p: LegacyProperty) {
  const fields = schemaProps(p.category.attribute_schema);
  const attributes: Record<string, unknown> = {};
  const amenities: PropertyAmenity[] = [];
  for (const [key, value] of Object.entries(p.attributes)) {
    if (!Array.isArray(value)) {
      attributes[key] = value;
      continue;
    }
    const items = fields[key]?.items;
    for (const raw of value as (string | number)[]) {
      const idx = items?.enum?.indexOf(raw) ?? -1;
      amenities.push({ slug: String(raw), name: (idx >= 0 && items?.enumNames?.[idx]) || String(raw), icon: null });
    }
  }
  return { attributes, amenities };
}

function stripArraySchema(schema: Record<string, unknown>): Record<string, unknown> {
  const props = Object.fromEntries(
    Object.entries(schemaProps(schema)).filter(([, field]) => !field.items),
  );
  return { ...schema, properties: props };
}

function toSummary(p: LegacyProperty): PropertySummary {
  const cover = p.images.find((i) => i.is_cover) ?? p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    operation_type: p.operation_type,
    currency: p.currency,
    price: Number(p.price).toFixed(2),
    subtype: p.subtype,
    lot_area_m2: p.lot_area_m2,
    built_area_m2: p.built_area_m2,
    location: toLocation(p.location_id),
    category: { slug: p.category.slug, name: p.category.name },
    cover_image: cover ? toImage(cover) : null,
    agency: MOCK_AGENCY,
    listed_at: p.created_at,
  };
}

function toDetail(p: LegacyProperty): PropertyDetail {
  const { attributes, amenities } = splitAttributes(p);
  const round3 = (v: string | null) => (v === null ? null : Math.round(Number(v) * 1000) / 1000);
  const lat = round3(p.lat);
  const lng = round3(p.lng);
  return {
    ...toSummary(p),
    category: { slug: p.category.slug, name: p.category.name, attribute_schema: stripArraySchema(p.category.attribute_schema) },
    description: p.description,
    address: p.address,
    coordinates: lat !== null && lng !== null ? { lat, lng } : null,
    attributes,
    images: [...p.images].sort((a, b) => a.position - b.position).map(toImage),
    amenities,
    agent: p.agent ? { first_name: p.agent.first_name, last_name: p.agent.last_name } : null,
  };
}

export const mockSummaries: PropertySummary[] = legacyProperties.map(toSummary);

export function mockDetail(agency: string, slug: string): PropertyDetail | null {
  if (agency !== MOCK_AGENCY.slug) return null;
  const found = legacyProperties.find((p) => p.slug === slug);
  return found ? toDetail(found) : null;
}

export const mockCategories: Category[] = legacyCategories.map((c) => ({
  slug: c.slug,
  name: c.name,
  description: c.description,
  attribute_schema: stripArraySchema(c.attribute_schema),
  amenities: [],
}));

function buildTree(parentId: string | null): LocationNode[] {
  return legacyLocations
    .filter((l) => l.parent_id === parentId)
    .map((l) => ({ id: l.id, name: l.name, type: l.type, children: buildTree(l.id) }));
}

export const mockLocationTree: LocationNode[] = buildTree(null);
