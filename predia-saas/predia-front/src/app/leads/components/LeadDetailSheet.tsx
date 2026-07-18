import { PencilLine } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/design-system/ui/sheet'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import Text from '@/design-system/typography/text'
import { extractApiError } from '@/shared/lib/notifications'
import { SOURCE_LABEL, SOURCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '@/app/leads/constants'
import { useLead } from '@/app/leads/hooks'
import type { Lead } from '@/app/leads/types'
import LeadActivityTimeline from '@/app/leads/components/LeadActivityTimeline'

interface LeadDetailSheetProps {
  leadId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  agentNameById: Map<string, string>
  propertyNameById: Map<string, string>
  onEdit: (lead: Lead) => void
}

function LeadDetailSheet({
  leadId,
  open,
  onOpenChange,
  agentNameById,
  propertyNameById,
  onEdit,
}: LeadDetailSheetProps) {
  const { data: lead, isLoading, error } = useLead(leadId ?? '')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isLoading ? 'Cargando...' : lead?.name ?? 'Lead'}</SheetTitle>
          <SheetDescription>Detalle del lead y actividad reciente.</SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-6 rounded-lg border border-hairline bg-surface-soft p-4">
            <Text as="sm" className="text-destructive">
              {extractApiError(error)}
            </Text>
          </div>
        )}

        {!isLoading && lead && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
              <Badge variant={SOURCE_VARIANT[lead.source]}>{SOURCE_LABEL[lead.source]}</Badge>
            </div>

            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Text as="sm" className="text-muted-foreground">Email</Text>
                <Text as="sm">{lead.email ?? '—'}</Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text as="sm" className="text-muted-foreground">Teléfono</Text>
                <Text as="sm">{lead.phone ?? '—'}</Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text as="sm" className="text-muted-foreground">Agente asignado</Text>
                <Text as="sm">{lead.assigned_to ? agentNameById.get(lead.assigned_to) ?? 'Desconocido' : 'Sin asignar'}</Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text as="sm" className="text-muted-foreground">Propiedad</Text>
                <Text as="sm">{lead.property_id ? propertyNameById.get(lead.property_id) ?? 'Desconocida' : 'Ninguna'}</Text>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Text as="sm" className="text-muted-foreground">Creado</Text>
                <Text as="sm">{new Date(lead.created_at).toLocaleDateString('es-CR')}</Text>
              </div>
            </dl>

            {lead.notes && (
              <div className="space-y-1.5">
                <Text as="sm" className="font-medium">Notas</Text>
                <Text as="sm" className="text-muted-foreground whitespace-pre-wrap">{lead.notes}</Text>
              </div>
            )}

            <div className="space-y-3">
              <Text as="sm" className="font-medium">Actividad</Text>
              <LeadActivityTimeline leadId={lead.id} />
            </div>
          </div>
        )}

        {lead && (
          <SheetFooter className="mt-6">
            <Button onClick={() => onEdit(lead)} className="gap-2">
              <PencilLine className="size-4" />
              Editar lead
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default LeadDetailSheet
