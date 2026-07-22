import { useQuery } from '@tanstack/react-query'
import { locationsService } from '../services/locations.service'
import { locationKeys } from '../types'

const STALE_24H = 1000 * 60 * 60 * 24

export const useLocationsTree = () => {
  return useQuery({
    queryKey: locationKeys.tree(),
    queryFn: () => locationsService.getTree(),
    staleTime: STALE_24H,
  })
}

export const useProvinces = () => {
  return useQuery({
    queryKey: locationKeys.provinces(),
    queryFn: () => locationsService.getProvinces(),
    staleTime: STALE_24H,
  })
}

export const useLocationChildren = (parentId: string | null) => {
  return useQuery({
    queryKey: locationKeys.children(parentId ?? ''),
    queryFn: () => locationsService.getChildren(parentId!),
    enabled: !!parentId,
    staleTime: STALE_24H,
  })
}
