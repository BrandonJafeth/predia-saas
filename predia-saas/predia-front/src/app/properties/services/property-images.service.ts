import { apiClient } from '@/shared/lib/api'
import type { PropertyImage } from '../types'

type UploadBody = { file?: string }

export const propertyImagesService = {
  async uploadImage(propertyId: string, file: File): Promise<PropertyImage> {
    const formData = new FormData()
    formData.append('file', file)

    const { data, error } = await apiClient.POST('/api/v1/properties/{propertyId}/images', {
      params: { path: { propertyId } },
      // openapi-fetch serializes multipart by passing the FormData through
      // (browser sets Content-Type + boundary). The generated type maps
      // format:binary to string, so cast the FormData.
      body: formData as unknown as UploadBody,
    })
    if (error) throw error
    return data as PropertyImage
  },

  async deleteImage(propertyId: string, imageId: string): Promise<void> {
    const { error } = await apiClient.DELETE('/api/v1/properties/{propertyId}/images/{imageId}', {
      params: { path: { propertyId, imageId } },
    })
    if (error) throw error
  },

  async setCover(propertyId: string, imageId: string): Promise<PropertyImage> {
    const { data, error } = await apiClient.PATCH(
      '/api/v1/properties/{propertyId}/images/{imageId}/cover',
      { params: { path: { propertyId, imageId } } },
    )
    if (error) throw error
    return data as PropertyImage
  },

  async reorderImages(
    propertyId: string,
    items: { id: string; position: number }[],
  ): Promise<PropertyImage[]> {
    const { data, error } = await apiClient.PATCH(
      '/api/v1/properties/{propertyId}/images/reorder',
      {
        params: { path: { propertyId } },
        body: { items },
      },
    )
    if (error) throw error
    return data as PropertyImage[]
  },
}
