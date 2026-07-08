import { z } from 'zod'
import type { infer as zInfer } from 'zod'

const LEAD_SOURCES = ['web', 'referral', 'walk_in', 'social', 'other'] as const
const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

const optionalUuid = z
  .string()
  .trim()
  .uuid('Debe ser un identificador válido')
  .or(z.literal(''))

export const createLeadSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(200),
  email: z.string().trim().email('Correo electrónico inválido').or(z.literal('')),
  phone: z.string().trim().max(50).or(z.literal('')),
  source: z.enum(LEAD_SOURCES, { message: 'Fuente inválida' }),
  assigned_to: optionalUuid,
  property_id: optionalUuid,
  notes: z.string().trim().max(2000).or(z.literal('')),
})

export const editLeadSchema = createLeadSchema.extend({
  status: z.enum(LEAD_STATUSES, { message: 'Estado inválido' }),
})

export type CreateLeadFormValues = zInfer<typeof createLeadSchema>
export type EditLeadFormValues = zInfer<typeof editLeadSchema>
