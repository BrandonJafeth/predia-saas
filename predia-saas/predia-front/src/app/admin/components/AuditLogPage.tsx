import { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { DatePicker } from '@/design-system/ui/date-picker'
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
import type { AuditLogEntry } from '@/app/admin/services/audit-log.service'
import {
  ACTION_LABEL,
  ACTION_VARIANT,
  AuditDetailDialog,
  entityLabel,
  ROLE_LABEL,
  ROLE_VARIANT,
  type FilterAction,
  type FilterEntity,
} from '@/app/admin/components/audit-log-shared'

const DEFAULT_LIMIT = 15

function AuditLogPage() {
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT
  const [entityFilter, setEntityFilter] = useState<FilterEntity>('all')
  const [actionFilter, setActionFilter] = useState<FilterAction>('all')
  const [from, setFrom] = useState<Date | undefined>(undefined)
  const [to, setTo] = useState<Date | undefined>(undefined)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)

  const toISO = (d: Date) => d.toISOString().split('T')[0]

  const params = {
    page,
    limit,
    ...(entityFilter !== 'all' ? { entity: entityFilter } : {}),
    ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
    ...(from ? { from: toISO(from) } : {}),
    ...(to ? { to: toISO(to) } : {}),
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

  const today = new Date()

  function handleFromChange(date: Date | undefined) {
    setFrom(date)
    // If new "from" is after current "to", clear "to"
    if (date && to && date > to) setTo(undefined)
    setPage(1)
  }

  function handleToChange(date: Date | undefined) {
    setTo(date)
    setPage(1)
  }

  function clearFilters() {
    setEntityFilter('all')
    setActionFilter('all')
    setFrom(undefined)
    setTo(undefined)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading as="lg">Registro de auditoría</Heading>
        <Text as="sm" className="text-muted-foreground mt-1">
          Historial de todas las acciones realizadas en la plataforma.
        </Text>
      </div>

      {/* Filters — right-aligned, uniform style */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Select value={entityFilter} onValueChange={handleEntityChange}>
          <SelectTrigger className="w-40 h-9 rounded-lg border-hairline bg-canvas text-sm">
            <SelectValue placeholder="Entidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las entidades</SelectItem>
            <SelectItem value="property">Propiedad</SelectItem>
            <SelectItem value="user">Usuario</SelectItem>
            <SelectItem value="tenant">Organización</SelectItem>
            <SelectItem value="api_key">API Key</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={handleActionChange}>
          <SelectTrigger className="w-40 h-9 rounded-lg border-hairline bg-canvas text-sm">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            <SelectItem value="CREATE">Crear</SelectItem>
            <SelectItem value="UPDATE">Actualizar</SelectItem>
            <SelectItem value="DELETE">Eliminar</SelectItem>
            <SelectItem value="SUSPEND">Suspender</SelectItem>
            <SelectItem value="REVOKE">Revocar</SelectItem>
          </SelectContent>
        </Select>

        <DatePicker
          value={from}
          onChange={handleFromChange}
          placeholder="Desde"
          maxDate={to ?? today}
        />

        <DatePicker
          value={to}
          onChange={handleToChange}
          placeholder="Hasta"
          minDate={from}
          maxDate={today}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-ink-muted hover:text-ink text-xs h-9 px-3">
            Limpiar
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
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
                <tr className="border-b border-hairline bg-[#F7F7F8]">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rol</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acción</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entidad</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Organización</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const isLast = i === entries.length - 1

                  return (
                    <tr
                      key={entry.id}
                      className={!isLast ? 'border-b border-hairline' : ''}
                    >
                      {/* Fecha */}
                      <td className="px-6 py-5 text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                        <span className="block">
                          {new Date(entry.created_at).toLocaleDateString('es-CR')}
                        </span>
                        <span className="block">
                          {new Date(entry.created_at).toLocaleTimeString('es-CR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5 text-sm">
                          <span className="font-medium">
                            {entry.actor_name ?? `${entry.actor_id.slice(0, 8)}…`}
                          </span>
                          {entry.actor_email && (
                            <span className="text-muted-foreground">{entry.actor_email}</span>
                          )}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-5">
                        <Badge variant={ROLE_VARIANT[entry.actor_role] ?? 'default'}>
                          {ROLE_LABEL[entry.actor_role] ?? entry.actor_role}
                        </Badge>
                      </td>

                      {/* Acción */}
                      <td className="px-6 py-5">
                        <Badge variant={ACTION_VARIANT[entry.action] ?? 'default'}>
                          {ACTION_LABEL[entry.action] ?? entry.action}
                        </Badge>
                      </td>

                      {/* Entidad */}
                      <td className="px-6 py-5 text-sm font-medium">
                        {entityLabel(entry.entity)}
                      </td>

                      {/* Organización */}
                      <td className="px-6 py-5 text-sm">
                        {entry.tenant_name ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{entry.tenant_name}</span>
                            {entry.tenant_slug && (
                              <span className="text-muted-foreground">{entry.tenant_slug}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Plataforma</span>
                        )}
                      </td>

                      {/* Detalle */}
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-full text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">Ver detalle</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {data?.meta && (
        <PaginationControls
          page={page}
          pageCount={data.meta.pageCount}
          itemCount={data.meta.itemCount}
          limit={limit}
          onPageChange={setPage}
        />
      )}

      <AuditDetailDialog
        entry={selectedEntry}
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null)
        }}
      />
    </div>
  )
}

export default AuditLogPage
