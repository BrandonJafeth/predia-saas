import { z } from 'zod'
import type { infer as zInfer } from 'zod'

export const createTenantSchema = z.object({
  tenantName: z.string().trim().min(1, 'El nombre es requerido'),
  tenantSlug: z
    .string()
    .trim()
    .min(1, 'El identificador es requerido')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Solo minúsculas, números y guiones (sin espacios ni mayúsculas)',
    ),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  firstName: z.string().trim().min(1, 'El nombre es requerido'),
  lastName: z.string().trim().min(1, 'El apellido es requerido'),
})

export type CreateTenantFormValues = zInfer<typeof createTenantSchema>
