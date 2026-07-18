import { z } from 'zod'
import type { JSONSchema } from '@/app/categories/types'

export function buildAttributesSchema(schema: JSONSchema | undefined): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  if (!schema?.properties) return z.object(shape)

  const requiredSet = new Set(schema.required ?? [])

  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!prop.type) continue

    const types = Array.isArray(prop.type) ? prop.type : [prop.type]
    const primaryType = types[0]

    let fieldSchema: z.ZodTypeAny

    switch (primaryType) {
      case 'number':
      case 'integer': {
        fieldSchema = z.string().refine(
          (v) => v === '' || !isNaN(Number(v)),
          prop.title ? `${prop.title} debe ser un número` : 'Debe ser un número',
        )
        if (prop.minimum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).refine(
            (v) => v === '' || Number(v) >= prop.minimum!,
            prop.title
              ? `${prop.title} debe ser mayor o igual a ${prop.minimum}`
              : `Mínimo ${prop.minimum}`,
          )
        }
        if (prop.maximum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodString).refine(
            (v) => v === '' || Number(v) <= prop.maximum!,
            prop.title
              ? `${prop.title} debe ser menor o igual a ${prop.maximum}`
              : `Máximo ${prop.maximum}`,
          )
        }
        if (requiredSet.has(key)) {
          fieldSchema = (fieldSchema as z.ZodString).refine(
            (v) => v !== '',
            prop.title ? `${prop.title} es requerido` : 'Campo requerido',
          )
        }
        break
      }

      case 'boolean': {
        fieldSchema = z.string().refine(
          (v) => ['true', 'false'].includes(v),
          'Selecciona un valor',
        )
        break
      }

      default: {
        if (prop.enum && prop.enum.length > 0) {
          const enumValues = prop.enum.map(String)
          fieldSchema = z.string()
          if (requiredSet.has(key)) {
            fieldSchema = (fieldSchema as z.ZodString).refine(
              (v) => enumValues.includes(v),
              prop.title ? `Selecciona ${prop.title}` : 'Selecciona una opción',
            )
          }
        } else {
          fieldSchema = z.string()
          if (prop.maxLength) {
            fieldSchema = (fieldSchema as z.ZodString).refine(
              (v) => v.length <= prop.maxLength!,
              prop.title
                ? `${prop.title} máximo ${prop.maxLength} caracteres`
                : `Máximo ${prop.maxLength} caracteres`,
            )
          }
          if (requiredSet.has(key)) {
            fieldSchema = (fieldSchema as z.ZodString).refine(
              (v) => v.trim().length > 0,
              prop.title ? `${prop.title} es requerido` : 'Campo requerido',
            )
          }
        }
        break
      }
    }

    shape[key] = fieldSchema
  }

  return z.object(shape)
}

export function validateAttributes(
  schema: JSONSchema | undefined,
  values: Record<string, string> | undefined,
): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {}

  if (!schema?.properties) return errors

  const zodSchema = buildAttributesSchema(schema)
  const result = zodSchema.safeParse(values ?? {})

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (path && !errors[path]) {
        errors[path] = issue.message
      }
    }
  }

  return errors
}
