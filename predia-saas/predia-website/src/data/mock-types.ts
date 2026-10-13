// Forma interna de los datos de ejemplo (espejo del modelo de predia-api, no
// del contrato público). mock-catalog.ts los traduce al contrato público para
// que la web funcione sin API (CI, desarrollo).
export type OperationType = 'sale' | 'rent' | 'lease';

export type PropertyStatus = 'draft' | 'active' | 'inactive' | 'sold' | 'rented' | 'archived';

export type CurrencyCode = 'CRC' | 'USD';

export type LocationType = 'province' | 'canton' | 'district';

export interface PropertyLocation {
  id: string;
  name: string;
  code: string;
  type: LocationType;
  parent_id: string | null;
}

// attribute_schema is a JSON Schema (draft-07) — see predia-api/src/scripts/seed-categories.ts
// for the real "bienes-raices" and "vehiculos" schemas this mirrors.
export interface PropertyCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  attribute_schema: Record<string, unknown>;
}

export interface PropertyAgent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  // NOT modeled on the backend User yet (schema.prisma has no phone/whatsapp field).
  // Kept optional + mock-only so the "contactar al agente" CTA has something to render
  // today; drop the TODO once predia-api adds real contact fields to User/Tenant.
  whatsapp?: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  position: number;
  is_cover: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  // Decimal on the backend, serialized as string over the wire — keep as string
  // here too so formatting/parsing logic is written once, against the real shape.
  price: string;
  operation_type: OperationType;
  status: PropertyStatus;
  subtype: string | null;
  currency: CurrencyCode;
  lot_area_m2: string | null;
  built_area_m2: string | null;
  address: string | null;
  lat: string | null;
  lng: string | null;
  location_id: string | null;
  category_id: string;
  agent_id: string | null;
  attributes: Record<string, unknown>;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  location: PropertyLocation | null;
  category: PropertyCategory;
  agent: PropertyAgent | null;
  images: PropertyImage[];
}
