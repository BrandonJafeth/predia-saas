import { z } from 'zod'
import type { infer as zInfer } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  role: z.enum(['admin', 'agent'], {
    message: 'Rol inválido',
  }),
})

export type CreateUserFormValues = zInfer<typeof createUserSchema>
