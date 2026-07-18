import type { LeadActivityType, LeadSource, LeadStatus } from '@/app/leads/types'

type BadgeVariant = 'default' | 'orange' | 'pink' | 'violet' | 'emerald'

export const SOURCE_LABEL: Record<LeadSource, string> = {
  web: 'Web',
  referral: 'Referido',
  walk_in: 'Visita',
  social: 'Redes sociales',
  other: 'Otro',
}

export const SOURCE_VARIANT: Record<LeadSource, BadgeVariant> = {
  web: 'violet',
  referral: 'emerald',
  walk_in: 'orange',
  social: 'pink',
  other: 'default',
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
  archived: 'Archivado',
}

export const STATUS_VARIANT: Record<LeadStatus, BadgeVariant> = {
  new: 'violet',
  contacted: 'orange',
  qualified: 'orange',
  proposal: 'pink',
  negotiation: 'pink',
  won: 'emerald',
  lost: 'default',
  archived: 'default',
}

// Mismos tokens de color que los badges (bg-badge-*/10, text-badge-*-strong)
// pero pensados para llenar una barra de encabezado completa — usado en las
// columnas del kanban para que cada etapa del pipeline se distinga de un
// vistazo.
export const STATUS_HEADER_CLASS: Record<LeadStatus, string> = {
  new: 'bg-badge-violet/10 text-badge-violet-strong border-badge-violet/20',
  contacted: 'bg-badge-orange/10 text-badge-orange-strong border-badge-orange/20',
  qualified: 'bg-badge-orange/10 text-badge-orange-strong border-badge-orange/20',
  proposal: 'bg-badge-pink/10 text-badge-pink-strong border-badge-pink/20',
  negotiation: 'bg-badge-pink/10 text-badge-pink-strong border-badge-pink/20',
  won: 'bg-badge-emerald/10 text-badge-emerald-strong border-badge-emerald/20',
  lost: 'bg-ink-soft/15 text-ink-body border-hairline',
  archived: 'bg-ink-soft/15 text-ink-body border-hairline',
}

// Estados del pipeline de ventas — excluye "archived" (los leads archivados
// salen del embudo y no se muestran en tabla/kanban).
export const PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const satisfies readonly LeadStatus[]

export const EDITABLE_STATUSES = PIPELINE_STATUSES.map((value) => ({
  label: STATUS_LABEL[value],
  value,
}))

export const STATUS_FILTER_OPTIONS = EDITABLE_STATUSES

export const NONE_VALUE = '__none__'

export const ACTIVITY_TYPE_LABEL: Record<LeadActivityType, string> = {
  call: 'Llamada',
  email: 'Correo',
  meeting: 'Reunión',
  note: 'Nota',
  status_change: 'Cambio de estado',
}

const ALL_STATUSES: readonly LeadStatus[] = [...PIPELINE_STATUSES, 'archived']

// El backend genera la descripción de las actividades "status_change" como
// texto libre en inglés ("Status changed from X to Y") — no hay un campo
// estructurado. Se extrae el status destino de ese texto para mostrar un
// badge en vez del texto crudo.
export function parseStatusChangeTarget(description: string): LeadStatus | null {
  const match = /to (\w+)$/.exec(description)
  const candidate = match?.[1]
  return ALL_STATUSES.find((status) => status === candidate) ?? null
}
