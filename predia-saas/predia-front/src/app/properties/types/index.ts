import type { components } from '@predia/api-types'

// The generated schema infers nullable string fields as Record<string,never>|null
// due to missing type info in openapi-typescript. Override with correct types.
type RawProperty = components['schemas']['PropertyResponseDto']

export type OperationType = 'sale' | 'rent' | 'lease'
export type PropertyStatus = 'draft' | 'active' | 'inactive' | 'sold' | 'rented'
export type CurrencyCode = 'CRC' | 'USD'

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
}

export type CreatePropertyRequest = components['schemas']['CreatePropertyDto']
export type UpdatePropertyRequest = Partial<CreatePropertyRequest>

export interface PropertyFilters {
  page?: number
  limit?: number
  operation_type?: OperationType
  status?: PropertyStatus
  is_published?: boolean
  category_id?: string
  location_id?: string
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
