import { z } from 'zod'

// TanStack Form pasa el estado crudo (string) al validator — la conversión a
// number ocurre en el onSubmit callback, no acá.
export const updateTenantSettingsSchema = z.object({
  maxImagesPerProperty: z
    .string()
    .min(1, 'El límite es requerido')
    .refine(
      (v) => !isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 1,
      'Debe ser un número entero mayor o igual a 1',
    ),
})

export type UpdateTenantSettingsFormValues = z.infer<typeof updateTenantSettingsSchema>
