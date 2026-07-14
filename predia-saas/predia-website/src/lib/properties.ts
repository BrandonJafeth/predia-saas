// Single seam between pages/components and the data source. Every function here
// reads the local mock today; swapping to the real public-api later means editing
// only this file's bodies — callers and the Property/PropertyCategory/etc. types
// (src/lib/types/property.ts) do not change.
import type { Property } from './types/property';
import { properties as mockProperties } from '../data/properties.mock';

export interface PropertyFilters {
  categorySlug?: string;
  operationType?: Property['operation_type'];
  locationId?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function getAllProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return mockProperties.filter((p) => {
    if (filters.categorySlug && p.category.slug !== filters.categorySlug) return false;
    if (filters.operationType && p.operation_type !== filters.operationType) return false;
    if (filters.locationId && p.location_id !== filters.locationId) return false;
    const price = Number(p.price);
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;
    return true;
  });
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  return mockProperties.find((p) => p.slug === slug) ?? null;
}

export function getCoverImage(property: Property): string | null {
  return property.images.find((img) => img.is_cover)?.url ?? property.images[0]?.url ?? null;
}

export function formatPrice(property: Property): string {
  const amount = Number(property.price);
  const formatted = new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(amount);
  const symbol = property.currency === 'USD' ? '$' : '₡';
  const suffix = property.operation_type === 'rent' ? ' /mes' : '';
  return `${symbol}${formatted}${suffix}`;
}

interface JsonSchemaField {
  title?: string;
  enum?: (string | number)[];
  enumNames?: string[];
  items?: JsonSchemaField;
}

// Renders property.attributes (raw jsonb values) as human labels using the owning
// category's attribute_schema (JSON Schema draft-07, see seed-categories.ts) —
// keeps display logic schema-driven instead of hardcoding per-category fields.
// Array fields (amenidades/extras) are excluded here — see getAmenities below,
// they get their own icon-grid treatment instead of a plain comma list.
export function formatAttributes(property: Property): { key: string; label: string; value: string }[] {
  const schemaProps = (property.category.attribute_schema as { properties?: Record<string, JsonSchemaField> })
    .properties;
  if (!schemaProps) return [];

  const entries: { key: string; label: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(property.attributes)) {
    const field = schemaProps[key];
    if (!field || raw === null || raw === undefined || raw === '' || Array.isArray(raw)) continue;

    const label = field.title ?? key;
    const value = field.enum && field.enumNames
      ? field.enumNames[field.enum.indexOf(raw as string | number)] ?? String(raw)
      : String(raw);

    entries.push({ key, label, value });
  }
  return entries;
}

// Array-type attributes (amenidades, extras) rendered Airbnb-style: icon + label
// per item, using amenity-icons.ts keyed by the raw enum value (not the display name).
export function getAmenities(property: Property): { key: string; label: string }[] {
  const schemaProps = (property.category.attribute_schema as { properties?: Record<string, JsonSchemaField> })
    .properties;
  if (!schemaProps) return [];

  const items: { key: string; label: string }[] = [];
  for (const [fieldKey, raw] of Object.entries(property.attributes)) {
    const field = schemaProps[fieldKey];
    if (!field || !Array.isArray(raw) || !field.items?.enum) continue;

    for (const value of raw as (string | number)[]) {
      const idx = field.items.enum.indexOf(value);
      const label = idx >= 0 && field.items.enumNames ? field.items.enumNames[idx] : String(value);
      items.push({ key: String(value), label });
    }
  }
  return items;
}
