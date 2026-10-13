import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import Text from '@/design-system/typography/text'
import { Skeleton } from '@/design-system/ui/skeleton'
import { Badge } from '@/design-system/ui/badge'
import { cn } from '@/shared/lib/utils'
import { PIPELINE_STATUSES, STATUS_HEADER_CLASS, STATUS_LABEL, STATUS_VARIANT } from '@/app/leads/constants'
import { assigneeName, type Lead, type LeadStatus } from '@/app/leads/types'
import LeadCard from '@/app/leads/components/LeadCard'

interface LeadsKanbanViewProps {
  leads: Lead[]
  isLoading?: boolean
  error?: boolean
  agentNameById: Map<string, string>
  // Total real por status (GET /leads/stats). El tablero trae como máximo 100
  // leads; con esto cada columna muestra su conteo real y cuántos faltan.
  totalByStatus?: Record<string, number>
  onShowMore?: (status: LeadStatus) => void
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
  // Puede devolver la promesa de la mutación: mientras está pendiente el
  // tablero mantiene la tarjeta en la columna destino.
  onStatusChange: (lead: Lead, status: LeadStatus) => Promise<unknown> | void
}

// La columna destino es la que está bajo el puntero (no la más cercana al
// centro de la tarjeta, que dependía de dónde la agarraste). Si el puntero
// cae en el hueco entre columnas, se usa la más cercana.
const collisionDetection: CollisionDetection = (args) => {
  const underPointer = pointerWithin(args)
  return underPointer.length > 0 ? underPointer : closestCenter(args)
}

// Animación corta hacia el lugar nuevo de la tarjeta (el default es 250ms
// 'ease'). La tarjeta real queda oculta mientras el overlay aterriza.
const dropAnimation: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } }),
}

function DraggableLeadCard(props: {
  lead: Lead
  agentName?: string
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
}) {
  // Sin transform: con DragOverlay lo que sigue al puntero es el overlay; la
  // tarjeta original queda quieta como placeholder (antes se movían las dos).
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.lead.id,
  })

  return (
    <div
      ref={setNodeRef}
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
  hiddenCount,
  agentNameById,
  onShowMore,
  onView,
  onEdit,
  onArchive,
}: {
  status: LeadStatus
  leads: Lead[]
  hiddenCount: number
  agentNameById: Map<string, string>
  onShowMore?: (status: LeadStatus) => void
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
        <Badge variant={STATUS_VARIANT[status]}>{leads.length + hiddenCount}</Badge>
      </div>
      <div className="flex-1 space-y-2 p-2.5 min-h-[6rem]">
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            agentName={assigneeName(lead, agentNameById)}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => onShowMore?.(status)}
            className="w-full rounded-lg border border-dashed border-hairline py-2 text-caption text-muted-foreground transition-colors hover:border-surface-strong hover:text-ink"
          >
            y {hiddenCount} más · ver en tabla
          </button>
        )}
        {leads.length === 0 && hiddenCount === 0 && (
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
  totalByStatus,
  onShowMore,
  onView,
  onEdit,
  onArchive,
  onStatusChange,
}: LeadsKanbanViewProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  // Movimientos ya soltados cuya mutación sigue en curso. Se aplican en el
  // mismo render del drop: la actualización optimista de React Query llega
  // unos ms después (onMutate es async), cuando dnd-kit ya midió la tarjeta en
  // la columna vieja y animaba el overlay de vuelta al origen.
  const [pendingStatus, setPendingStatus] = useState<Record<string, LeadStatus>>({})
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const leadsByStatus = useMemo(() => {
    const grouped = new Map<LeadStatus, Lead[]>(PIPELINE_STATUSES.map((s) => [s, []]))
    for (const lead of leads) {
      grouped.get(pendingStatus[lead.id] ?? lead.status)?.push(lead)
    }
    return grouped
  }, [leads, pendingStatus])

  // Cuántos leads de cada status no vinieron en esta página: total del
  // backend menos los que el cache tiene con ese status (sin contar los
  // movimientos pendientes, que el stats optimista ya refleja).
  const hiddenByStatus = useMemo(() => {
    const loaded = new Map<string, number>()
    for (const lead of leads) loaded.set(lead.status, (loaded.get(lead.status) ?? 0) + 1)
    return new Map(
      PIPELINE_STATUSES.map((s) => [
        s,
        Math.max(0, (totalByStatus?.[s] ?? loaded.get(s) ?? 0) - (loaded.get(s) ?? 0)),
      ]),
    )
  }, [leads, totalByStatus])

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
    if (!lead || (pendingStatus[lead.id] ?? lead.status) === newStatus) return

    setPendingStatus((prev) => ({ ...prev, [lead.id]: newStatus }))
    // Al terminar la mutación el cache ya tiene el status real (o volvió al
    // anterior si falló): se suelta el override.
    void Promise.resolve(onStatusChange(lead, newStatus))
      .catch(() => {})
      .finally(() =>
        setPendingStatus((prev) => {
          const next = { ...prev }
          delete next[lead.id]
          return next
        }),
      )
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
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveLead(null)}
    >
      <div className="flex gap-3 overflow-x-auto scroll-x-visible pb-2">
        {PIPELINE_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            leads={leadsByStatus.get(status) ?? []}
            hiddenCount={hiddenByStatus.get(status) ?? 0}
            agentNameById={agentNameById}
            onShowMore={onShowMore}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
          />
        ))}
      </div>
      {/* Portal a <body>: el overlay es position: fixed y cualquier ancestro
          con transform (p. ej. la animación de entrada de página) lo
          desplazaba respecto del puntero y hacía caer la tarjeta en otra
          columna. */}
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeLead && (
            <LeadCard
              lead={activeLead}
              agentName={assigneeName(activeLead, agentNameById)}
              onView={onView}
              onEdit={onEdit}
              onArchive={onArchive}
              dragging
              className="w-72"
            />
          )}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  )
}

export default LeadsKanbanView
