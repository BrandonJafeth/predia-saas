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
  name: z.string().trim().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  email: z
    .string()
    .trim()
    .max(254, 'Máximo 254 caracteres')
    .email('Correo electrónico inválido')
    .or(z.literal('')),
  phone: z.string().trim().max(50, 'Máximo 50 caracteres').or(z.literal('')),
  source: z.enum(LEAD_SOURCES, { message: 'Fuente inválida' }),
  assigned_to: optionalUuid,
  property_id: optionalUuid,
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres').or(z.literal('')),
})

export const editLeadSchema = createLeadSchema.extend({
  status: z.enum(LEAD_STATUSES, { message: 'Estado inválido' }),
})

export type CreateLeadFormValues = zInfer<typeof createLeadSchema>
export type EditLeadFormValues = zInfer<typeof editLeadSchema>
