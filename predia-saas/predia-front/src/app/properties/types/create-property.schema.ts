import { z } from 'zod'

const toOptionalNumber = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined
    const n = Number(val)
    return isNaN(n) ? undefined : n
  },
  z.number().positive('Debe ser positivo').optional(),
)

export const createPropertySchema = z.object({
  title: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: z.string().max(5000).optional(),
  price: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined
      const n = Number(val)
      return isNaN(n) ? undefined : n
    },
    z
      .number({
        required_error: 'El precio es requerido',
        invalid_type_error: 'Ingresa un precio válido',
      })
      .positive('El precio debe ser positivo'),
  ),
  operation_type: z.enum(['sale', 'rent', 'lease'], {
    required_error: 'Selecciona el tipo de operación',
  }),
  currency: z.enum(['CRC', 'USD']).default('CRC'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  subtype: z.string().max(100).optional(),
  lot_area_m2: toOptionalNumber,
  built_area_m2: toOptionalNumber,
  address: z.string().max(500).optional(),
})

export type CreatePropertyFormValues = z.infer<typeof createPropertySchema>
