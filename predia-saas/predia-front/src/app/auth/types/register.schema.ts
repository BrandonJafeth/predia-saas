import { z } from 'zod'
import type { infer as zInfer } from 'zod'

export const registerSchema = z.object({
  tenantName: z.string().trim().min(1, 'Requerido'),
  tenantSlug: z
    .string()
    .trim()
    .min(1, 'Requerido')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  firstName: z.string().trim().min(1, 'Requerido'),
  lastName: z.string().trim().min(1, 'Requerido'),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

export type RegisterFormValues = zInfer<typeof registerSchema>
