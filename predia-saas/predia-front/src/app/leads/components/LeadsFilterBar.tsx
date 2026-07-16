import { useEffect, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { STATUS_FILTER_OPTIONS } from '@/app/leads/constants'
import type { LeadStatus } from '@/app/leads/types'

// Mismo lenguaje visual que los filtros del registro de auditoría
// (src/app/audit-log/components/TenantAuditLogPage.tsx): controles compactos
// h-9, rounded-lg, border-hairline, bg-canvas.
const FILTER_TRIGGER_CLASS = 'w-auto min-w-40 h-9 rounded-lg border-hairline bg-canvas text-sm'

const ALL_VALUE = '__all__'

type AgentOption = { id: string; label: string }

interface LeadsFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: LeadStatus | undefined
  onStatusChange: (value: LeadStatus | undefined) => void
  assignedTo: string | undefined
  onAssignedToChange: (value: string | undefined) => void
  agentOptions: AgentOption[]
  // Renderizado como el último ítem de la misma fila (ej. el toggle
  // tabla/pipeline), en el mismo grupo alineado a la derecha que los
  // filtros — no como un bloque aparte.
  right?: ReactNode
}

function LeadsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  assignedTo,
  onAssignedToChange,
  agentOptions,
  right,
}: LeadsFilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(search)
  // Adjusting state when a prop changes, without an Effect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setSearchDraft(search)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== search) onSearchChange(searchDraft)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  const hasActiveFilters = !!search || status !== undefined || assignedTo !== undefined

  function clearFilters() {
    setSearchDraft('')
    onSearchChange('')
    onStatusChange(undefined)
    onAssignedToChange(undefined)
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono..."
          className="h-9 w-full rounded-lg border-hairline bg-canvas pl-9 text-sm"
        />
      </div>

      <Select
        value={status ?? ALL_VALUE}
        onValueChange={(v) => onStatusChange(v === ALL_VALUE ? undefined : (v as LeadStatus))}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los estados</SelectItem>
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={assignedTo ?? ALL_VALUE}
        onValueChange={(v) => onAssignedToChange(v === ALL_VALUE ? undefined : v)}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Agente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los agentes</SelectItem>
          {agentOptions.map((opt) => (
            <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-ink-muted hover:text-ink text-xs h-9 px-3"
        >
          Limpiar
        </Button>
      )}

      {right}
    </div>
  )
}

export default LeadsFilterBar
