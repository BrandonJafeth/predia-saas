import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import type { AuditAction, AuditActorRole, AuditEntity, AuditLogEntry } from '@/app/admin/services/audit-log.service'

export const ACTION_VARIANT: Record<AuditAction, 'default' | 'emerald' | 'violet' | 'pink' | 'orange'> = {
  CREATE: 'emerald',
  UPDATE: 'violet',
  DELETE: 'pink',
  SUSPEND: 'orange',
  REVOKE: 'orange',
}

export const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  SUSPEND: 'Suspendió',
  REVOKE: 'Revocó',
}

export const ROLE_VARIANT: Record<AuditActorRole, 'default' | 'emerald' | 'orange'> = {
  super_admin: 'default',
  admin: 'emerald',
  agent: 'orange',
}

export const ROLE_LABEL: Record<AuditActorRole, string> = {
  super_admin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
}

export const ENTITY_LABEL: Record<AuditEntity, string> = {
  property: 'Propiedad',
  user: 'Usuario',
  tenant: 'Organización',
  api_key: 'API Key',
  lead: 'Lead',
}

// Backend audit entries can reference entities outside AuditEntity's known
// union — translate the ones we know about and fall back to a readable
// label instead of showing the raw slug.
const EXTRA_ENTITY_LABEL: Record<string, string> = {
  category: 'Categoría',
}

export function entityLabel(entity: string): string {
  const known = ENTITY_LABEL[entity as AuditEntity] ?? EXTRA_ENTITY_LABEL[entity]
  if (known) return known
  return entity
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export type FilterEntity = AuditEntity | 'all'
export type FilterAction = AuditAction | 'all'

// ─── Human-readable payload rendering ────────────────────────────────────────
//
// Audit payloads are raw entity snapshots (property, user, tenant, api_key or
// lead rows). Clients reviewing this log aren't developers, so every field is
// translated to a plain-language label and value instead of showing JSON.

type JsonObj = Record<string, unknown>

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Fields that are internal bookkeeping, redundant with what's already shown
// elsewhere in the dialog, or security-sensitive — never shown to the user.
const HIDDEN_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id',
  'password', 'password_hash', 'refresh_token', 'access_token',
])

const FIELD_LABELS: Record<string, string> = {
  title: 'Título',
  name: 'Nombre',
  first_name: 'Nombre',
  last_name: 'Apellido',
  email: 'Correo electrónico',
  phone: 'Teléfono',
  description: 'Descripción',
  price: 'Precio',
  currency: 'Moneda',
  operation_type: 'Tipo de operación',
  category_id: 'Categoría',
  subtype: 'Subtipo',
  lot_area_m2: 'Área del lote',
  built_area_m2: 'Área construida',
  address: 'Dirección',
  slug: 'Enlace',
  status: 'Estado',
  role: 'Rol',
  is_active: 'Activo',
  is_published: 'Publicada',
  bedrooms: 'Habitaciones',
  bathrooms: 'Baños',
  parking_spaces: 'Espacios de parqueo',
  message: 'Mensaje',
  source: 'Origen',
  domain: 'Dominio',
  plan: 'Plan',
  expires_at: 'Fecha de expiración',
  last_used_at: 'Último uso',
  contact_name: 'Nombre de contacto',
  contact_email: 'Correo de contacto',
  contact_phone: 'Teléfono de contacto',
}

const ENUM_LABELS: Record<string, Record<string, string>> = {
  operation_type: { sale: 'Venta', rent: 'Alquiler', lease: 'Arrendamiento' },
  currency: { CRC: 'Colones (₡)', USD: 'Dólares ($)' },
  status: {
    draft: 'Borrador',
    active: 'Activa',
    inactive: 'Inactiva',
    sold: 'Vendida',
    rented: 'Alquilada',
    pending: 'Pendiente',
    suspended: 'Suspendida',
    contacted: 'Contactado',
    closed: 'Cerrado',
    open: 'Abierto',
  },
  role: { super_admin: 'Superadmin', admin: 'Admin', agent: 'Agente' },
}

function fieldLabel(key: string): string {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function isHiddenField(key: string, before: unknown, after: unknown): boolean {
  if (HIDDEN_FIELDS.has(key)) return true
  if (/password|secret|token|hash/i.test(key)) return true
  const sample = before ?? after
  if (typeof sample === 'string' && UUID_RE.test(sample)) return true
  return false
}

function formatValue(key: string, value: unknown, sibling: JsonObj): string {
  if (value === null) return 'Sin definir'
  if (value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'

  const enumMap = ENUM_LABELS[key]
  if (enumMap && typeof value === 'string' && enumMap[value]) return enumMap[value]

  if (key === 'price' && (typeof value === 'number' || typeof value === 'string')) {
    const num = Number(value)
    if (!isNaN(num)) {
      const currency = typeof sibling.currency === 'string' ? sibling.currency : undefined
      const symbol = currency === 'USD' ? '$' : currency === 'CRC' ? '₡' : ''
      return `${symbol}${new Intl.NumberFormat('es-CR').format(num)}`
    }
  }

  if ((key === 'lot_area_m2' || key === 'built_area_m2') && (typeof value === 'number' || typeof value === 'string')) {
    const num = Number(value)
    if (!isNaN(num)) return `${new Intl.NumberFormat('es-CR').format(num)} m²`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 'Ninguno'
    if (value.every((v) => typeof v !== 'object' || v === null)) return value.map(String).join(', ')
    return `${value.length} elemento${value.length !== 1 ? 's' : ''}`
  }

  if (typeof value === 'object') return 'Ver detalles'

  return String(value)
}

function DiffTable({ before, after }: { before: JsonObj; after: JsonObj }) {
  const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  const changedKeys = allKeys.filter(
    (k) =>
      JSON.stringify(before[k]) !== JSON.stringify(after[k]) &&
      !isHiddenField(k, before[k], after[k]),
  )

  if (changedKeys.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No se registraron cambios visibles.</p>
  }

  return (
    <div className="rounded-md border border-hairline overflow-hidden divide-y divide-hairline">
      {changedKeys.map((key) => (
        <div key={key} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-sm">
          <span className="font-medium text-foreground">{fieldLabel(key)}:</span>
          <span className="text-muted-foreground line-through">
            {before[key] === undefined ? '—' : formatValue(key, before[key], before)}
          </span>
          <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-foreground">
            {after[key] === undefined ? '—' : formatValue(key, after[key], after)}
          </span>
        </div>
      ))}
    </div>
  )
}

function SingleTable({ label, obj }: { label: string; obj: JsonObj }) {
  const keys = Object.keys(obj).filter((k) => !isHiddenField(k, obj[k], obj[k]))

  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Sin datos.</p>
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="rounded-md border border-hairline overflow-hidden divide-y divide-hairline">
        {keys.map((key) => (
          <div key={key} className="flex flex-wrap gap-x-2 px-3 py-2.5 text-sm">
            <span className="font-medium text-foreground">{fieldLabel(key)}:</span>
            <span className="text-muted-foreground">{formatValue(key, obj[key], obj)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PayloadPanel({ payload }: { payload: AuditLogEntry['payload'] }) {
  const before = payload.before as JsonObj | undefined
  const after = payload.after as JsonObj | undefined

  if (before && after) return <DiffTable before={before} after={after} />
  if (after) return <SingleTable label="Datos registrados" obj={after} />
  if (before) return <SingleTable label="Datos antes de la eliminación" obj={before} />
  return <p className="text-sm text-muted-foreground italic">Sin datos disponibles.</p>
}

// ─── Detail dialog ───────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string
  children: ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3 py-2.5 border-b border-hairline last:border-0">
      <span className="text-sm font-medium text-muted-foreground pt-0.5">{label}</span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

interface AuditDetailDialogProps {
  entry: AuditLogEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditDetailDialog({ entry, open, onOpenChange }: AuditDetailDialogProps) {
  if (!entry) return null

  const date = new Date(entry.created_at)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-5 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del evento</DialogTitle>
        </DialogHeader>

        <div>
          <DetailRow label="Fecha">
            {date.toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {date.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
          </DetailRow>

          <DetailRow label="Actor">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {entry.actor_name ?? `${entry.actor_id.slice(0, 8)}…`}
                </span>
                <Badge variant={ROLE_VARIANT[entry.actor_role] ?? 'default'}>
                  {ROLE_LABEL[entry.actor_role] ?? entry.actor_role}
                </Badge>
              </div>
              {entry.actor_email && (
                <span className="text-muted-foreground">{entry.actor_email}</span>
              )}
            </div>
          </DetailRow>

          <DetailRow label="Acción">
            <Badge variant={ACTION_VARIANT[entry.action] ?? 'default'}>
              {ACTION_LABEL[entry.action] ?? entry.action}
            </Badge>
          </DetailRow>

          <DetailRow label="Entidad">
            <span className="font-medium">{entityLabel(entry.entity)}</span>
          </DetailRow>

          {entry.tenant_name && (
            <DetailRow label="Organización">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{entry.tenant_name}</span>
                {entry.tenant_slug && (
                  <span className="text-muted-foreground">{entry.tenant_slug}</span>
                )}
              </div>
            </DetailRow>
          )}

          <DetailRow label="Cambios">
            <PayloadPanel payload={entry.payload} />
          </DetailRow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
