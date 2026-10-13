import { z } from 'zod'
import type { infer as zInfer } from 'zod'

const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Espejo de normalizeOrigin del backend: el server vuelve a validar. */
export function parseOrigin(value: string): string | null {
  const raw = value.trim()
  if (!raw || raw.includes('*')) return null
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.username || url.password || url.search || url.hash) return null
  if (url.pathname !== '/' && url.pathname !== '') return null
  if (url.protocol === 'https:') return url.origin
  if (url.protocol === 'http:' && LOCALHOSTS.has(url.hostname)) return url.origin
  return null
}

export function splitOrigins(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((o) => o.trim())
    .filter(Boolean)
}

export const createApiKeySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80, 'Máximo 80 caracteres'),
    type: z.enum(['publishable', 'secret'], { message: 'Tipo inválido' }),
    allowed_origins: z.string(),
    expires_at: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'publishable') {
      const origins = splitOrigins(value.allowed_origins)
      if (origins.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['allowed_origins'],
          message: 'Agregá al menos un origen (ej. https://www.tusitio.com)',
        })
      } else if (origins.length > 10) {
        ctx.addIssue({ code: 'custom', path: ['allowed_origins'], message: 'Máximo 10 orígenes' })
      } else {
        const invalid = origins.filter((o) => parseOrigin(o) === null)
        if (invalid.length > 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['allowed_origins'],
            message: `Origen inválido: ${invalid.join(', ')}. Usá https://host sin rutas ni comodines (http solo para localhost).`,
          })
        }
      }
    }
    if (value.expires_at) {
      const date = new Date(`${value.expires_at}T23:59:59`)
      if (Number.isNaN(date.getTime()) || date <= new Date()) {
        ctx.addIssue({ code: 'custom', path: ['expires_at'], message: 'Elegí una fecha futura' })
      }
    }
  })

export type CreateApiKeyFormValues = zInfer<typeof createApiKeySchema>
