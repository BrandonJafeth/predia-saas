import type { CurrencyCode, OperationType, PropertyStatus } from './types'

export const PAGE_LIMIT_OPTIONS = [5, 10, 15, 25] as const
export const DEFAULT_PAGE_LIMIT = 15

export type BadgeVariant = 'default' | 'orange' | 'pink' | 'violet' | 'emerald'

export const PROPERTY_STATUSES = [
  'draft',
  'active',
  'inactive',
  'sold',
  'rented',
] as const satisfies readonly PropertyStatus[]

export const STATUS_LABEL: Record<PropertyStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  inactive: 'Inactiva',
  sold: 'Vendida',
  rented: 'Arrendada',
  archived: 'Eliminada',
}

export const STATUS_VARIANT: Record<PropertyStatus, BadgeVariant | null> = {
  draft: null,
  active: 'emerald',
  inactive: null,
  sold: 'violet',
  rented: 'orange',
  archived: 'pink',
}

export const STATUS_FILTER_OPTIONS = PROPERTY_STATUSES.map((value) => ({
  value,
  label: STATUS_LABEL[value],
}))

export const OPERATION_LABEL: Record<OperationType, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
  lease: 'Arrendamiento',
}

export const OPERATION_FILTER_OPTIONS = (['sale', 'rent', 'lease'] as const).map((value) => ({
  value,
  label: OPERATION_LABEL[value],
}))

export const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  CRC: '₡ CRC',
  USD: '$ USD',
}
