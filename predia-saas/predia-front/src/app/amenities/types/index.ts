export interface Amenity {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryAmenity {
  category_id: string
  amenity_id: string
  amenity: Amenity
}

export interface PropertyAmenity {
  property_id: string
  amenity_id: string
  amenity: Amenity
}

export const amenityKeys = {
  all: ['amenities'] as const,
  lists: () => [...amenityKeys.all, 'list'] as const,
}