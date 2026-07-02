import { z } from 'zod'

const optionalPositiveNumberStr = z
  .string()
  .refine(
    (v) => v === '' || (!isNaN(Number(v)) && Number(v) > 0),
    'Debe ser un número positivo',
  )

const optionalTrimmedText = (max: number, message: string) =>
  z.string().trim().max(max, message)

// All form values are strings — TanStack Form passes raw state to onSubmit,
// Zod Standard Schema validators must match the form's inferred type exactly.
// Number conversion happens in the onSubmit callback, not here.
export const createPropertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  description: optionalTrimmedText(5000, 'Máximo 5000 caracteres'),
  price: z
    .string()
    .min(1, 'El precio es requerido')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      'El precio debe ser un número positivo',
    ),
  operation_type: z
    .string()
    .refine(
      (v) => ['sale', 'rent', 'lease'].includes(v),
      'Selecciona el tipo de operación',
    ),
  currency: z.enum(['CRC', 'USD'] as const),
  category_id: z.string().min(1, 'La categoría es requerida'),
  subtype: optionalTrimmedText(100, 'Máximo 100 caracteres'),
  lot_area_m2: optionalPositiveNumberStr,
  built_area_m2: optionalPositiveNumberStr,
  address: optionalTrimmedText(500, 'Máximo 500 caracteres'),
})

export type CreatePropertyFormValues = z.infer<typeof createPropertySchema>
