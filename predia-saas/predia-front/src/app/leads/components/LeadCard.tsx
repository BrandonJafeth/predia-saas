import { Mail, MoreHorizontal, Phone, PencilLine, Archive, Eye } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'
import { SOURCE_LABEL, SOURCE_VARIANT } from '@/app/leads/constants'
import type { Lead } from '@/app/leads/types'

interface LeadCardProps {
  lead: Lead
  agentName?: string
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
  className?: string
  dragging?: boolean
}

function LeadCard({ lead, agentName, onView, onEdit, onArchive, className, dragging }: LeadCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-hairline bg-canvas p-2.5 shadow-soft transition-shadow',
        dragging ? 'shadow-raised opacity-90' : 'hover:shadow-raised',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <button
          type="button"
          onClick={() => onView(lead)}
          className="text-left text-caption font-medium text-ink hover:underline"
        >
          {lead.name}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onView(lead)}>
              <Eye />
              <span>Ver detalle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(lead)}>
              <PencilLine />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onArchive(lead)}
            >
              <Archive />
              <span>Archivar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(lead.email || lead.phone) && (
        <div className="mt-1.5 space-y-0.5">
          {lead.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge
          variant={SOURCE_VARIANT[lead.source]}
          className="shrink-0 whitespace-nowrap px-1.5 py-0 text-[11px] leading-4"
        >
          {SOURCE_LABEL[lead.source]}
        </Badge>
        <span className="truncate text-[11px] text-muted-foreground">
          {agentName ?? 'Sin asignar'}
        </span>
      </div>
    </div>
  )
}

export default LeadCard
