import type { components } from '@predia/api-types'
import type { CategoryAmenity } from '@/app/amenities/types'
import type { Category } from '@/app/categories/types'

// The generated schema infers nullable string fields as Record<string,never>|null
// due to missing type info in openapi-typescript. Override with correct types.
type RawProperty = components['schemas']['PropertyResponseDto']

export type OperationType = 'sale' | 'rent' | 'lease'
export type PropertyStatus = 'draft' | 'active' | 'inactive' | 'sold' | 'rented' | 'archived'
export type CurrencyCode = 'CRC' | 'USD'

export interface PropertyImage {
  id: string
  url: string
  position: number
  is_cover: boolean
  created_at: string
}

export interface PropertyLocation {
  id: string
  name: string
  code: string
  type: 'province' | 'canton' | 'district'
  parent_id: string | null
}

export interface PropertyAgent {
  id: string
  first_name: string
  last_name: string
  email: string
}

export interface Property extends Omit<
  RawProperty,
  'description' | 'subtype' | 'lot_area_m2' | 'built_area_m2' | 'address' | 'lat' | 'lng' | 'location_id' | 'agent_id' | 'attributes'
> {
  description: string | null
  subtype: string | null
  lot_area_m2: string | null
  built_area_m2: string | null
  address: string | null
  lat: string | null
  lng: string | null
  location_id: string | null
  agent_id: string | null
  attributes: Record<string, unknown>
  cover_image: PropertyImage | null
  amenities?: CategoryAmenity[]
}

export interface PropertyDetail extends Property {
  location: PropertyLocation | null
  category: Category
  agent: PropertyAgent | null
  images: PropertyImage[]
  amenities: CategoryAmenity[]
  max_images_per_property: number
}

// attributes is generated as Record<string,never> (openapi-typescript quirk for
// additionalProperties without a type) — override to the actual dynamic shape.
export type CreatePropertyRequest = Omit<components['schemas']['CreatePropertyDto'], 'attributes'> & {
  attributes?: Record<string, unknown>
}
export type UpdatePropertyRequest = Partial<CreatePropertyRequest>

export type PropertySortField = 'price' | 'created_at'
export type SortOrder = 'asc' | 'desc'

// Espejo del query de GET /api/v1/properties (FindPropertiesDto en el backend).
export interface PropertyFilters {
  page?: number
  limit?: number
  operation_type?: OperationType
  status?: PropertyStatus
  currency?: CurrencyCode
  subtype?: string
  search?: string
  location_id?: string
  price_min?: number
  price_max?: number
  lot_area_min?: number
  lot_area_max?: number
  built_area_min?: number
  built_area_max?: number
  sort_by?: PropertySortField
  order?: SortOrder
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    itemCount: number
    pageCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export const propertyKeys = {
  all: ['properties'] as const,
  lists: () => [...propertyKeys.all, 'list'] as const,
  list: (filters?: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, 'detail'] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  bySlug: (slug: string) => [...propertyKeys.all, 'slug', slug] as const,
}
