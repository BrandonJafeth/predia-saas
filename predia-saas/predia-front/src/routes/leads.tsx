import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import TenantLeadsPage from '@/app/leads/components/TenantLeadsPage'
import { tokenStorage } from '@/shared/lib/tokens'

const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived',
] as const

const searchSchema = z.object({
  view: z.enum(['table', 'kanban']).catch('table'),
  page: z.number().int().positive().catch(1),
  status: z.enum(LEAD_STATUSES).optional().catch(undefined),
  assigned_to: z.string().optional().catch(undefined),
  search: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/leads')({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const role = tokenStorage.decodeAccessToken()?.role
    if (role !== 'admin' && role !== 'agent') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: TenantLeadsPage,
})
