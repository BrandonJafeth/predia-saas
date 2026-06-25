import type { components } from '@predia/api-types'

export type Category = Omit<
  components['schemas']['CategoryResponseDto'],
  'attribute_schema' | 'description'
> & {
  description: string | null
  attribute_schema: JSONSchema
}

export type CreateCategoryRequest = Omit<
  components['schemas']['CreateCategoryDto'],
  'attribute_schema'
> & { attribute_schema: JSONSchema }

export type UpdateCategoryRequest = Omit<
  components['schemas']['UpdateCategoryDto'],
  'attribute_schema'
> & { attribute_schema?: JSONSchema }

// JSON Schema Draft-07 — only the fields used in our attribute_schema definitions
export interface JSONSchema {
  $schema?: string
  type?: string
  required?: string[]
  properties?: Record<string, JSONSchemaProperty>
}

export interface JSONSchemaProperty {
  type?: string | string[]
  title?: string
  description?: string
  enum?: (string | number)[]
  enumNames?: string[]
  minimum?: number
  maximum?: number
  maxLength?: number
  multipleOf?: number
  uniqueItems?: boolean
  items?: JSONSchemaProperty
  format?: string
}

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  detail: (slug: string) => [...categoryKeys.all, 'detail', slug] as const,
  detailById: (id: string) => [...categoryKeys.all, 'detail-id', id] as const,
}
