import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { propertyImagesService } from '../services/property-images.service'
import { propertyKeys, type PropertyDetail, type PropertyImage } from '../types'
import { notify, extractApiError } from '@/shared/lib/notifications'

const REORDER_DEBOUNCE_MS = 800

function getDetail(queryClient: ReturnType<typeof useQueryClient>, propertyId: string) {
  return queryClient.getQueryData<PropertyDetail>(propertyKeys.detail(propertyId))
}

function setImages(
  queryClient: ReturnType<typeof useQueryClient>,
  propertyId: string,
  images: PropertyImage[],
) {
  const detail = getDetail(queryClient, propertyId)
  if (!detail) return
  queryClient.setQueryData<PropertyDetail>(propertyKeys.detail(propertyId), {
    ...detail,
    images,
  })
}

export const useUploadPropertyImage = (propertyId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => propertyImagesService.uploadImage(propertyId, file),
    onSuccess: (image) => {
      const detail = getDetail(queryClient, propertyId)
      if (detail) setImages(queryClient, propertyId, [...detail.images, image])
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
    onError: (err) => {
      notify.error({ title: 'Error al subir imagen', description: extractApiError(err) })
    },
  })
}

export const useDeletePropertyImage = (propertyId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => propertyImagesService.deleteImage(propertyId, imageId),
    onMutate: async (imageId) => {
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(propertyId) })
      const detail = getDetail(queryClient, propertyId)
      const previous = detail?.images ?? null
      if (detail) setImages(queryClient, propertyId, detail.images.filter((img) => img.id !== imageId))
      return { previous }
    },
    onError: (err, _imageId, context) => {
      if (context?.previous) setImages(queryClient, propertyId, context.previous)
      notify.error({ title: 'Error al eliminar imagen', description: extractApiError(err) })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

export const useSetPropertyCover = (propertyId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => propertyImagesService.setCover(propertyId, imageId),
    onMutate: async (imageId) => {
      await queryClient.cancelQueries({ queryKey: propertyKeys.detail(propertyId) })
      const detail = getDetail(queryClient, propertyId)
      const previous = detail?.images ?? null
      if (detail) {
        setImages(
          queryClient,
          propertyId,
          detail.images.map((img) => ({ ...img, is_cover: img.id === imageId })),
        )
      }
      return { previous }
    },
    onError: (err, _imageId, context) => {
      if (context?.previous) setImages(queryClient, propertyId, context.previous)
      notify.error({ title: 'Error al marcar portada', description: extractApiError(err) })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
    },
  })
}

/**
 * Debounced optimistic reorder: each drag updates the cache immediately, but
 * the PATCH is fired once after REORDER_DEBOUNCE_MS of inactivity to avoid
 * spamming requests mid-drag.
 */
export const useReorderPropertyImages = (propertyId: string) => {
  const queryClient = useQueryClient()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<PropertyImage[] | null>(null)
  const previousRef = useRef<PropertyImage[] | null>(null)

  const reorderMutation = useMutation({
    mutationFn: (images: PropertyImage[]) =>
      propertyImagesService.reorderImages(
        propertyId,
        images.map((img, index) => ({ id: img.id, position: index })),
      ),
    onError: (err) => {
      if (previousRef.current) setImages(queryClient, propertyId, previousRef.current)
      notify.error({ title: 'Error al reordenar imágenes', description: extractApiError(err) })
    },
    onSettled: () => {
      pendingRef.current = null
      previousRef.current = null
      queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
    },
  })

  // Keep the latest mutation callbacks reachable from the debounced timer
  const mutationRef = useRef(reorderMutation)

  useEffect(() => {
    mutationRef.current = reorderMutation
  }, [reorderMutation])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const reorder = (images: PropertyImage[]) => {
    const detail = getDetail(queryClient, propertyId)
    const previous = detail?.images ?? null
    previousRef.current = previous
    // La imagen que queda en la primera posición pasa a ser portada
    const next = images.map((img, index) => ({ ...img, is_cover: index === 0 }))
    pendingRef.current = next
    if (detail) setImages(queryClient, propertyId, next)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (pendingRef.current) mutationRef.current.mutate(pendingRef.current)
    }, REORDER_DEBOUNCE_MS)
  }

  return { reorder }
}
