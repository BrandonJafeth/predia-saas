import { z } from 'zod'
import type { infer as zInfer } from 'zod'

export const createSuperAdminSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
})

export type CreateSuperAdminFormValues = zInfer<typeof createSuperAdminSchema>
