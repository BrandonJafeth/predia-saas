import { Fragment, useState } from 'react'
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useSystemAuditLog } from '@/app/admin/hooks'
import type { AuditAction, AuditActorRole, AuditEntity, AuditLogEntry } from '@/app/admin/services/audit-log.service'

const DEFAULT_LIMIT = 20

const ACTION_VARIANT: Record<AuditAction, 'default' | 'emerald' | 'violet' | 'pink' | 'orange'> = {
  CREATE: 'emerald',
  UPDATE: 'violet',
  DELETE: 'pink',
  SUSPEND: 'orange',
  REVOKE: 'orange',
}

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
  SUSPEND: 'Suspendió',
  REVOKE: 'Revocó',
}

const ROLE_VARIANT: Record<AuditActorRole, 'default' | 'emerald' | 'orange'> = {
  super_admin: 'default',
  admin: 'emerald',
  agent: 'orange',
}

const ROLE_LABEL: Record<AuditActorRole, string> = {
  super_admin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
}

const ENTITY_LABEL: Record<AuditEntity, string> = {
  property: 'Propiedad',
  user: 'Usuario',
  tenant: 'Organización',
  api_key: 'API Key',
  lead: 'Lead',
}

type FilterEntity = AuditEntity | 'all'
type FilterAction = AuditAction | 'all'

// ─── Payload diff component ───────────────────────────────────────────────────

type JsonObj = Record<string, unknown>

interface PayloadPanelProps {
  payload: AuditLogEntry['payload']
}

function renderValue(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return '—'
  if (typeof val === 'string') return `"${val}"`
  return JSON.stringify(val)
}

function DiffTable({ before, after }: { before: JsonObj; after: JsonObj }) {
  const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])]
  const changedKeys = allKeys.filter(
    (k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]),
  )
  const unchangedKeys = allKeys.filter(
    (k) => JSON.stringify(before[k]) === JSON.stringify(after[k]),
  )

  return (
    <div className="space-y-3">
      {changedKeys.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            {changedKeys.length} campo{changedKeys.length !== 1 ? 's' : ''} modificado{changedKeys.length !== 1 ? 's' : ''}
          </p>
          <div className="rounded-md border border-hairline overflow-hidden">
            {changedKeys.map((key) => {
              const isAdded = before[key] === undefined
              const isRemoved = after[key] === undefined
              return (
                <div
                  key={key}
                  className={`grid grid-cols-[9rem_1fr_auto_1fr] items-center gap-2 px-3 py-2 text-xs border-b border-hairline last:border-0 ${
                    isAdded
                      ? 'bg-badge-emerald/10'
                      : isRemoved
                        ? 'bg-badge-pink/10'
                        : 'bg-badge-orange/10'
                  }`}
                >
                  <span className="font-medium text-foreground truncate">{key}</span>
                  <span className="font-mono truncate text-muted-foreground line-through">
                    {isAdded ? '—' : renderValue(before[key])}
                  </span>
                  <ChevronRight className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-mono truncate text-foreground">
                    {isRemoved ? '—' : renderValue(after[key])}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {unchangedKeys.length > 0 && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors">
            {unchangedKeys.length} campo{unchangedKeys.length !== 1 ? 's' : ''} sin cambios
          </summary>
          <div className="rounded-md border border-hairline overflow-hidden mt-1.5">
            {unchangedKeys.map((key) => (
              <div
                key={key}
                className="grid grid-cols-[9rem_1fr] gap-2 px-3 py-2 text-xs border-b border-hairline last:border-0 text-muted-foreground"
              >
                <span className="font-medium">{key}</span>
                <span className="font-mono truncate">{renderValue(before[key])}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {changedKeys.length === 0 && unchangedKeys.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Sin datos de payload.</p>
      )}
    </div>
  )
}

function SingleTable({ label, obj }: { label: string; obj: JsonObj }) {
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return <p className="text-xs text-muted-foreground italic">Sin datos.</p>
  }
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      <div className="rounded-md border border-hairline overflow-hidden">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="grid grid-cols-[9rem_1fr] gap-2 px-3 py-2 text-xs border-b border-hairline last:border-0"
          >
            <span className="font-medium text-muted-foreground">{key}</span>
            <span className="font-mono truncate">{renderValue(val)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PayloadPanel({ payload }: PayloadPanelProps) {
  const before = payload.before as JsonObj | undefined
  const after = payload.after as JsonObj | undefined

  if (before && after) return <DiffTable before={before} after={after} />
  if (after) return <SingleTable label="Estado final" obj={after} />
  if (before) return <SingleTable label="Estado anterior" obj={before} />
  return <p className="text-xs text-muted-foreground italic">Sin datos de payload.</p>
}

// ─── Main page ────────────────────────────────────────────────────────────────

function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [entityFilter, setEntityFilter] = useState<FilterEntity>('all')
  const [actionFilter, setActionFilter] = useState<FilterAction>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params = {
    page,
    limit,
    ...(entityFilter !== 'all' ? { entity: entityFilter } : {}),
    ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }

  const { data, isLoading, error: fetchError } = useSystemAuditLog(params)
  const entries = data?.data ?? []

  const hasActiveFilters = entityFilter !== 'all' || actionFilter !== 'all' || !!from || !!to

  function handleEntityChange(val: string) {
    setEntityFilter(val as FilterEntity)
    setPage(1)
  }

  function handleActionChange(val: string) {
    setActionFilter(val as FilterAction)
    setPage(1)
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFrom(e.target.value)
    setPage(1)
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTo(e.target.value)
    setPage(1)
  }

  function clearFilters() {
    setEntityFilter('all')
    setActionFilter('all')
    setFrom('')
    setTo('')
    setPage(1)
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <Heading as="lg">Registro de auditoría</Heading>
        <Text as="sm" className="text-muted-foreground mt-1">
          Historial de todas las acciones realizadas en la plataforma.
        </Text>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Entidad
          </label>
          <Select value={entityFilter} onValueChange={handleEntityChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="property">Propiedad</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
              <SelectItem value="tenant">Organización</SelectItem>
              <SelectItem value="api_key">API Key</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Acción
          </label>
          <Select value={actionFilter} onValueChange={handleActionChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="CREATE">Crear</SelectItem>
              <SelectItem value="UPDATE">Actualizar</SelectItem>
              <SelectItem value="DELETE">Eliminar</SelectItem>
              <SelectItem value="SUSPEND">Suspender</SelectItem>
              <SelectItem value="REVOKE">Revocar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Desde
          </label>
          <Input type="date" value={from} onChange={handleFromChange} className="w-40" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Hasta
          </label>
          <Input type="date" value={to} onChange={handleToChange} className="w-40" />
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="self-end">
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-canvas rounded-2xl border border-hairline shadow-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <Text as="md" className="font-semibold">
            Eventos
            {data && (
              <span className="ml-2 text-muted-foreground font-normal text-sm">
                ({data.meta?.itemCount ?? entries.length})
              </span>
            )}
          </Text>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-destructive">
              Error al cargar el registro de auditoría.
            </Text>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Text as="sm" className="text-muted-foreground">
              No hay eventos con los filtros seleccionados.
            </Text>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="px-4 py-3 w-8" />
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Actor</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Acción</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Entidad</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Organización</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isExpanded = expandedId === entry.id
                  const isLast = i === entries.length - 1

                  return (
                    <Fragment key={entry.id}>
                      <tr
                        onClick={() => toggleExpand(entry.id)}
                        className={`cursor-pointer hover:bg-surface-soft/30 transition-colors ${!isLast || isExpanded ? 'border-b border-hairline' : ''}`}
                      >
                        <td className="pl-4 py-4 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="px-6 py-4 text-muted-foreground tabular-nums whitespace-nowrap">
                          <span className="block">
                            {new Date(entry.created_at).toLocaleDateString('es-CR')}
                          </span>
                          <span className="block text-xs">
                            {new Date(entry.created_at).toLocaleTimeString('es-CR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Actor */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {entry.actor_name ?? (
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {entry.actor_id.slice(0, 8)}…
                                  </span>
                                )}
                              </span>
                              <Badge variant={ROLE_VARIANT[entry.actor_role] ?? 'default'}>
                                {ROLE_LABEL[entry.actor_role] ?? entry.actor_role}
                              </Badge>
                            </div>
                            {entry.actor_email && (
                              <span className="text-xs text-muted-foreground">
                                {entry.actor_email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Acción + Entidad inline */}
                        <td className="px-6 py-4">
                          <Badge variant={ACTION_VARIANT[entry.action] ?? 'default'}>
                            {ACTION_LABEL[entry.action] ?? entry.action}
                          </Badge>
                        </td>

                        {/* Entidad */}
                        <td className="px-6 py-4">
                          <span className="font-medium">
                            {ENTITY_LABEL[entry.entity] ?? entry.entity}
                          </span>
                          <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                            #{entry.entity_id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Organización */}
                        <td className="px-6 py-4">
                          {entry.tenant_name ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{entry.tenant_name}</span>
                              {entry.tenant_slug && (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {entry.tenant_slug}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Plataforma
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandido: payload diff */}
                      {isExpanded && (
                        <tr className={!isLast ? 'border-b border-hairline' : ''}>
                          <td colSpan={6} className="px-6 py-5 bg-surface-soft/20">
                            <PayloadPanel payload={entry.payload} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data?.meta && (
          <PaginationControls
            page={page}
            pageCount={data.meta.pageCount}
            itemCount={data.meta.itemCount}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1) }}
          />
        )}
      </div>
    </div>
  )
}

export default AuditLogPage
