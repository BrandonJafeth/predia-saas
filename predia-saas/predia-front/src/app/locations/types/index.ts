export type LocationType = 'province' | 'canton' | 'district'

export interface Location {
  id: string
  name: string
  code: string
  type: LocationType
  parent_id: string | null
  created_at: string
}

export interface LocationNode extends Location {
  children: LocationNode[]
}

export const locationKeys = {
  all: ['locations'] as const,
  provinces: () => [...locationKeys.all, 'provinces'] as const,
  tree: () => [...locationKeys.all, 'tree'] as const,
  children: (parentId: string) => [...locationKeys.all, 'children', parentId] as const,
}
