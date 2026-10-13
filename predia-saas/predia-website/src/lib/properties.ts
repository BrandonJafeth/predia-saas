// Única costura entre las páginas y la fuente de datos. Con PREDIA_API_URL +
// PREDIA_API_SECRET_KEY lee la API pública de predia-api (key de portal: todas
// las inmobiliarias con suscripción vigente); sin ellas usa los datos de
// ejemplo de src/data. Todo corre en el build: el navegador recibe HTML.
import type {
  Category,
  LocationNode,
  PropertyDetail,
  PropertyLike,
  PropertyPage,
  PropertySummary,
} from './types/property';
import { apiGet, isApiConfigured, mapLimit } from './predia-api';
import { mockCategories, mockDetail, mockLocationTree, mockSummaries } from '../data/mock-catalog';

export const usingSampleData = !isApiConfigured;

if (usingSampleData) {
  console.warn(
    '[predia-website] PREDIA_API_URL / PREDIA_API_SECRET_KEY sin configurar: se usan datos de ejemplo.',
  );
}

const PAGE_SIZE = 50; // máximo que acepta el API
const MAX_PAGES = 200; // tope defensivo: 10.000 propiedades

// Un build pide lo mismo desde varias páginas (home, listado, detalle):
// una sola request por recurso.
let summariesPromise: Promise<PropertySummary[]> | null = null;
let categoriesPromise: Promise<Category[]> | null = null;
let locationsPromise: Promise<LocationNode[]> | null = null;
const detailCache = new Map<string, Promise<PropertyDetail | null>>();

async function fetchAllSummaries(): Promise<PropertySummary[]> {
  const all: PropertySummary[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await apiGet<PropertyPage>('/public/v1/properties', { page, limit: PAGE_SIZE, sort: 'newest' });
    if (!res) break;
    all.push(...res.data);
    if (!res.meta.hasNextPage) break;
  }
  return all;
}

export function getAllProperties(): Promise<PropertySummary[]> {
  summariesPromise ??= usingSampleData ? Promise.resolve(mockSummaries) : fetchAllSummaries();
  return summariesPromise;
}

export function getPropertyDetail(agency: string, slug: string): Promise<PropertyDetail | null> {
  const key = `${agency}/${slug}`;
  let cached = detailCache.get(key);
  if (!cached) {
    cached = usingSampleData
      ? Promise.resolve(mockDetail(agency, slug))
      : apiGet<PropertyDetail>(`/public/v1/properties/${encodeURIComponent(slug)}`, { tenant: agency });
    detailCache.set(key, cached);
  }
  return cached;
}

/** Detalle de todas las propiedades (para getStaticPaths), 4 requests a la vez. */
export async function getAllPropertyDetails(): Promise<PropertyDetail[]> {
  const summaries = await getAllProperties();
  const details = await mapLimit(summaries, 4, (p) => getPropertyDetail(p.agency.slug, p.slug));
  return details.filter((d): d is PropertyDetail => d !== null);
}

export function getCategories(): Promise<Category[]> {
  categoriesPromise ??= usingSampleData
    ? Promise.resolve(mockCategories)
    : apiGet<Category[]>('/public/v1/categories').then((c) => c ?? []);
  return categoriesPromise;
}

export function getLocationTree(): Promise<LocationNode[]> {
  locationsPromise ??= usingSampleData
    ? Promise.resolve(mockLocationTree)
    : apiGet<LocationNode[]>('/public/v1/locations').then((l) => l ?? []);
  return locationsPromise;
}

// ─── Presentación ──────────────────────────────────────────────────────────

export function propertyPath(p: PropertyLike): string {
  return `/propiedades/${p.agency.slug}/${p.slug}`;
}

export function formatPrice(property: PropertyLike): string {
  const amount = Number(property.price);
  const formatted = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(amount);
  const symbol = property.currency === 'USD' ? '$' : '₡';
  const suffix = property.operation_type === 'rent' ? ' /mes' : '';
  return `${symbol}${formatted}${suffix}`;
}

/** "San Rafael, Escazú, San José" */
export function formatLocation(property: PropertyLike): string | null {
  if (!property.location) return null;
  return [property.location.name, ...property.location.parents].join(', ');
}

interface JsonSchemaField {
  title?: string;
  enum?: (string | number)[];
  enumNames?: string[];
}

// attributes (jsonb) → etiquetas legibles con el attribute_schema de la
// categoría (JSON Schema draft-07): la presentación depende del schema, no de
// campos fijos por categoría.
export function formatAttributes(property: PropertyDetail): { key: string; label: string; value: string }[] {
  const schemaProps = (property.category.attribute_schema as { properties?: Record<string, JsonSchemaField> })
    .properties;
  if (!schemaProps) return [];

  const entries: { key: string; label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(property.attributes)) {
    const field = schemaProps[key];
    if (!field || raw === null || raw === undefined || raw === '' || Array.isArray(raw)) continue;
    const label = field.title ?? key;
    const value =
      field.enum && field.enumNames
        ? (field.enumNames[field.enum.indexOf(raw as string | number)] ?? String(raw))
        : String(raw);
    entries.push({ key, label, value });
  }
  return entries;
}
