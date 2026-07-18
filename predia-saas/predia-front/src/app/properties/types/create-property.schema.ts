import { z } from 'zod'

const optionalNumberStr = z
  .string()
  .refine(
    (v) => v === '' || !isNaN(Number(v)),
    'Debe ser un número',
  )

const optionalTrimmedText = (max: number, message: string) =>
  z.string().trim().max(max, message)

// All form values are strings — TanStack Form passes raw state to onSubmit,
// Zod Standard Schema validators must match the form's inferred type exactly.
// Number conversion happens in the onSubmit callback, not here.
export const propertyFormSchema = z.object({
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
  address: optionalTrimmedText(500, 'Máximo 500 caracteres'),
  lat: optionalNumberStr,
  lng: optionalNumberStr,
  location_id: z.string(),
  is_published: z.boolean(),
  attributes: z.record(z.string(), z.string()),
}).superRefine((data, ctx) => {
  const hasLat = data.lat !== undefined && data.lat !== ''
  const hasLng = data.lng !== undefined && data.lng !== ''

  if (hasLat !== hasLng) {
    if (hasLat && !hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lng'],
        message: 'Longitud requerida cuando se envía latitud',
      })
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'Latitud requerida cuando se envía longitud',
      })
    }
  }

  if (hasLat) {
    const latNum = Number(data.lat)
    if (latNum < -90 || latNum > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lat'],
        message: 'Latitud debe estar entre -90 y 90',
      })
    }
  }

  if (hasLng) {
    const lngNum = Number(data.lng)
    if (lngNum < -180 || lngNum > 180) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lng'],
        message: 'Longitud debe estar entre -180 y 180',
      })
    }
  }
})

export type PropertyFormValues = z.infer<typeof propertyFormSchema>
