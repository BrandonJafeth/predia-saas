import { z } from 'zod'
import type { infer as zInfer } from 'zod'

export const createTenantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo minúsculas, números y guiones (sin espacios ni mayúsculas)',
    ),
})

export type CreateTenantFormValues = zInfer<typeof createTenantSchema>
