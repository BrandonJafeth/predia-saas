import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Loader2, Mail, Phone, RefreshCw, StickyNote, Users } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import Text from '@/design-system/typography/text'
import { cn } from '@/shared/lib/utils'
import { useCreateLeadActivity, useLeadActivitiesInfinite } from '@/app/leads/hooks'
import {
  ACTIVITY_TYPE_LABEL,
  STATUS_LABEL,
  STATUS_VARIANT,
  parseStatusChangeTarget,
} from '@/app/leads/constants'
import type { LeadActivity, LeadActivityType } from '@/app/leads/types'

const ACTIVITY_ICON: Record<LeadActivityType, typeof Mail> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  note: StickyNote,
  status_change: RefreshCw,
}

// El usuario solo puede registrar estos tipos manualmente — "status_change"
// lo genera el backend automáticamente al actualizar el status del lead.
const LOGGABLE_TYPES: LeadActivityType[] = ['call', 'email', 'meeting', 'note']

interface LeadActivityTimelineProps {
  leadId: string
}

function ActivityItem({ activity }: { activity: LeadActivity }) {
  const Icon = ACTIVITY_ICON[activity.type]
  const isStatusChange = activity.type === 'status_change'
  const targetStatus = isStatusChange ? parseStatusChangeTarget(activity.description) : null
  const isOptimistic = activity.id.startsWith('optimistic-')

  return (
    <li className="relative pl-1">
      <div
        className={cn(
          'absolute -left-[1.6rem] flex size-6 items-center justify-center rounded-full border bg-canvas',
          isStatusChange ? 'border-primary/30 bg-primary/10' : 'border-hairline',
        )}
      >
        <Icon className={cn('size-3.5', isStatusChange ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <div className={cn('space-y-1', isOptimistic && 'opacity-60')}>
        <div className="flex flex-wrap items-center gap-1.5">
          <Text as="sm" className="font-medium">{ACTIVITY_TYPE_LABEL[activity.type]}</Text>
          {targetStatus && (
            <Badge variant={STATUS_VARIANT[targetStatus]}>{STATUS_LABEL[targetStatus]}</Badge>
          )}
          <Text as="sm" className="text-muted-foreground">
            · {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
          </Text>
        </div>
        {!targetStatus && (
          <Text as="sm" className="text-muted-foreground">{activity.description}</Text>
        )}
        <Text as="sm" className="text-muted-foreground">
          {activity.creator.first_name} {activity.creator.last_name}
        </Text>
      </div>
    </li>
  )
}

function LeadActivityTimeline({ leadId }: LeadActivityTimelineProps) {
  const [type, setType] = useState<LeadActivityType>('note')
  const [description, setDescription] = useState('')

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLeadActivitiesInfinite(leadId)
  const { mutate: createActivity, isPending: isCreating } = useCreateLeadActivity(leadId)

  const activities = data?.pages.flatMap((page) => page.data) ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = description.trim()
    if (!trimmed) return
    createActivity({ type, description: trimmed }, { onSuccess: () => setDescription('') })
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-hairline bg-surface-soft p-3">
        <Select value={type} onValueChange={(v: LeadActivityType) => setType(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOGGABLE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{ACTIVITY_TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe la gestión..."
          rows={2}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isCreating || !description.trim()}>
            {isCreating && <Loader2 className="size-4 animate-spin" />}
            Agregar
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && error && (
        <Text as="sm" className="text-destructive">Error al cargar la actividad.</Text>
      )}

      {!isLoading && !error && activities.length === 0 && (
        <Text as="sm" className="text-muted-foreground">Sin actividad registrada.</Text>
      )}

      {activities.length > 0 && (
        <ol className="space-y-4 border-l border-hairline pl-6">
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ol>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
            Cargar más
          </Button>
        </div>
      )}
    </div>
  )
}

export default LeadActivityTimeline
