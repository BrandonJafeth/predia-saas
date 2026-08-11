import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import PropertiesPage from '@/app/properties/components/PropertiesPage'
import { DEFAULT_PAGE_LIMIT, PAGE_LIMIT_OPTIONS } from '@/app/properties/constants'
import { tokenStorage } from '@/shared/lib/tokens'

const LIMIT_VALUES = PAGE_LIMIT_OPTIONS as readonly number[]

const searchSchema = z.object({
  page: z.coerce.number().int().positive().optional().catch(1),
  limit: z.coerce.number().int().refine((v) => LIMIT_VALUES.includes(v)).optional().catch(DEFAULT_PAGE_LIMIT),
  search: z.string().optional().catch(undefined),
  operation_type: z.enum(['sale', 'rent', 'lease']).optional().catch(undefined),
  status: z.enum(['draft', 'active', 'inactive', 'sold', 'rented']).optional().catch(undefined),
  location_id: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/properties')({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    if (role !== 'admin' && role !== 'agent') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: PropertiesPage,
})
