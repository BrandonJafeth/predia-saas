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
  advisor_email: z.string().email('Correo electrónico inválido'),
  advisor_password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  advisor_first_name: z.string().min(1, 'El nombre es requerido'),
  advisor_last_name: z.string().min(1, 'El apellido es requerido'),
})

export type CreateTenantFormValues = zInfer<typeof createTenantSchema>
