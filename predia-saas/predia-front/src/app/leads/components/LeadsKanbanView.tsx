import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import Text from '@/design-system/typography/text'
import { Skeleton } from '@/design-system/ui/skeleton'
import { Badge } from '@/design-system/ui/badge'
import { cn } from '@/shared/lib/utils'
import { PIPELINE_STATUSES, STATUS_HEADER_CLASS, STATUS_LABEL, STATUS_VARIANT } from '@/app/leads/constants'
import type { Lead, LeadStatus } from '@/app/leads/types'
import LeadCard from '@/app/leads/components/LeadCard'

interface LeadsKanbanViewProps {
  leads: Lead[]
  isLoading?: boolean
  error?: boolean
  agentNameById: Map<string, string>
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
  onStatusChange: (lead: Lead, status: LeadStatus) => void
}

function DraggableLeadCard(props: {
  lead: Lead
  agentName?: string
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn('touch-none cursor-grab', isDragging && 'opacity-40')}
    >
      <LeadCard {...props} />
    </div>
  )
}

function KanbanColumn({
  status,
  leads,
  agentNameById,
  onView,
  onEdit,
  onArchive,
}: {
  status: LeadStatus
  leads: Lead[]
  agentNameById: Map<string, string>
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-hairline bg-surface-soft/60 transition-colors',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      <div className={cn('flex items-center justify-between gap-2 border-b px-3 py-2.5', STATUS_HEADER_CLASS[status])}>
        <Text as="sm" className="font-semibold">{STATUS_LABEL[status]}</Text>
        <Badge variant={STATUS_VARIANT[status]}>{leads.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 p-2.5 min-h-[6rem]">
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            agentName={lead.assigned_to ? agentNameById.get(lead.assigned_to) : undefined}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-hairline py-6">
            <Text as="sm" className="text-muted-foreground">Sin leads</Text>
          </div>
        )}
      </div>
    </div>
  )
}

function LeadsKanbanView({
  leads,
  isLoading,
  error,
  agentNameById,
  onView,
  onEdit,
  onArchive,
  onStatusChange,
}: LeadsKanbanViewProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const leadsByStatus = useMemo(() => {
    const grouped = new Map<LeadStatus, Lead[]>(PIPELINE_STATUSES.map((s) => [s, []]))
    for (const lead of leads) {
      grouped.get(lead.status)?.push(lead)
    }
    return grouped
  }, [leads])

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id)
    setActiveLead(lead ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null)
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as LeadStatus
    const lead = leads.find((l) => l.id === active.id)
    if (lead && lead.status !== newStatus) {
      onStatusChange(lead, newStatus)
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto scroll-x-visible pb-2">
        {PIPELINE_STATUSES.map((status) => (
          <div key={status} className="w-72 shrink-0 space-y-2 rounded-xl border border-hairline bg-surface-soft/60 p-2.5">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Text as="sm" className="text-destructive">Error al cargar los leads.</Text>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-hairline bg-canvas py-16">
        <Text as="sm" className="text-muted-foreground">No hay leads todavía.</Text>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto scroll-x-visible pb-2">
        {PIPELINE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={leadsByStatus.get(status) ?? []}
            agentNameById={agentNameById}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead && (
          <LeadCard
            lead={activeLead}
            agentName={activeLead.assigned_to ? agentNameById.get(activeLead.assigned_to) : undefined}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
            dragging
            className="w-72"
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default LeadsKanbanView
