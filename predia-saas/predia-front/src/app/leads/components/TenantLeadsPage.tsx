import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { AlertTriangle, Kanban, Loader2, Plus, Table as TableIcon } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useUsers } from '@/app/users/hooks'
import { useProperties } from '@/app/properties/hooks'
import { useLeads, useCreateLead, useUpdateLead, useArchiveLead } from '@/app/leads/hooks'
import type { Lead, LeadStatus } from '@/app/leads/types'
import { leadKeys } from '@/app/leads/types'
import { leadsService } from '@/app/leads/services/leads.service'
import { notify } from '@/shared/lib/notifications'
import { useIsMobile } from '@/shared/hooks/useIsMobile'
import { cn } from '@/shared/lib/utils'
import { tokenStorage } from '@/shared/lib/tokens'
import LeadsFilterBar from '@/app/leads/components/LeadsFilterBar'
import LeadsTableView from '@/app/leads/components/LeadsTableView'
import LeadsKanbanView from '@/app/leads/components/LeadsKanbanView'
import LeadDetailSheet from '@/app/leads/components/LeadDetailSheet'
import LeadForm from '@/app/leads/components/LeadForm'

const TABLE_LIMIT = 15
const KANBAN_LIMIT = 100

type AgentOption = { id: string; label: string }

const routeApi = getRouteApi('/leads')

// --- ViewToggle ---

function ViewToggle({ view, onChange }: { view: 'table' | 'kanban'; onChange: (v: 'table' | 'kanban') => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-hairline bg-canvas p-1">
      <button
        type="button"
        onClick={() => onChange('table')}
        aria-pressed={view === 'table'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-ink',
        )}
      >
        <TableIcon className="size-4" />
        Tabla
      </button>
      <button
        type="button"
        onClick={() => onChange('kanban')}
        aria-pressed={view === 'kanban'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-ink',
        )}
      >
        <Kanban className="size-4" />
        Pipeline
      </button>
    </div>
  )
}

// --- TenantLeadsPage ---

function TenantLeadsPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const isMobile = useIsMobile()
  const isAdmin = tokenStorage.decodeAccessToken()?.role === 'admin'

  const [open, setOpen] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Lead | null>(null)
  const [viewLeadId, setViewLeadId] = useState<string | null>(null)
  const [bulkArchiving, setBulkArchiving] = useState(false)

  const queryClient = useQueryClient()
  const sortBy = sorting[0]?.id as 'name' | 'status' | 'source' | 'created_at' | undefined
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined

  // En móvil se fuerza la vista de tabla (simplificada), sin perder la
  // preferencia de vista guardada en la URL para cuando vuelva a desktop.
  const effectiveView = isMobile ? 'table' : search.view

  const { data, isLoading, error: fetchError } = useLeads(
    effectiveView === 'kanban'
      ? { limit: KANBAN_LIMIT, status: search.status, assigned_to: search.assigned_to, search: search.search }
      : {
          page: search.page,
          limit: TABLE_LIMIT,
          status: search.status,
          assigned_to: search.assigned_to,
          search: search.search,
          sortBy,
          sortOrder,
        },
  )
  const { data: agentsData } = useUsers({ limit: 100 })
  // Solo para resolver el nombre de la propiedad en el detalle de un lead —
  // el selector del formulario busca de forma independiente (PropertyCombobox).
  const { data: propertiesData } = useProperties({ limit: 100 })
  const { mutate: createLead, isPending: isCreating } = useCreateLead()
  const { mutate: updateLead, isPending: isUpdating } = useUpdateLead()
  const { mutate: archiveLead, isPending: isArchiving } = useArchiveLead()

  const agentOptions: AgentOption[] = (agentsData?.data ?? []).map((u) => ({
    id: u.id,
    label: `${u.first_name} ${u.last_name}`,
  }))
  const agentNameById = new Map(agentOptions.map((a) => [a.id, a.label]))
  const propertyNameById = new Map((propertiesData?.data ?? []).map((p) => [p.id, p.title]))

  function updateSearch(patch: Partial<typeof search>, resetPage = true) {
    navigate({
      search: (prev) => ({ ...prev, ...patch, ...(resetPage ? { page: 1 } : {}) }),
    })
  }

  function handleConfirmArchive() {
    if (!archiveTarget) return
    archiveLead(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) })
  }

  async function handleBulkArchive(rows: Lead[], clearSelection: () => void) {
    setBulkArchiving(true)
    const results = await Promise.allSettled(rows.map((lead) => leadsService.remove(lead.id)))
    const failed = results.filter((r) => r.status === 'rejected').length
    setBulkArchiving(false)
    clearSelection()
    queryClient.invalidateQueries({ queryKey: leadKeys.lists() })

    if (failed === 0) {
      notify.success({
        title: `${rows.length} lead${rows.length === 1 ? '' : 's'} archivado${rows.length === 1 ? '' : 's'}`,
      })
    } else {
      notify.error({
        title: 'Algunos leads no se pudieron archivar',
        description: `${failed} de ${rows.length} fallaron.`,
      })
    }
  }

  function handleStatusChange(lead: Lead, status: LeadStatus) {
    updateLead({ id: lead.id, status })
  }

  const leads: Lead[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Leads</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Administra los clientes potenciales de tu organización.
          </Text>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nuevo lead
        </Button>
      </div>

      <LeadForm
        mode="create"
        open={open}
        onOpenChange={setOpen}
        isSubmitting={isCreating}
        agentOptions={agentOptions}
        isAdmin={isAdmin}
        onCreate={(values) => createLead(values, { onSuccess: () => setOpen(false) })}
      />

      <LeadForm
        key={editLead?.id ?? 'no-edit'}
        mode="edit"
        open={!!editLead}
        lead={editLead}
        onOpenChange={(v) => { if (!v) setEditLead(null) }}
        isSubmitting={isUpdating}
        agentOptions={agentOptions}
        isAdmin={isAdmin}
        onEdit={(id, values) => updateLead({ id, ...values }, { onSuccess: () => setEditLead(null) })}
      />

      <LeadDetailSheet
        leadId={viewLeadId}
        open={!!viewLeadId}
        onOpenChange={(v) => { if (!v) setViewLeadId(null) }}
        agentNameById={agentNameById}
        propertyNameById={propertyNameById}
        onEdit={(lead) => { setViewLeadId(null); setEditLead(lead) }}
      />

      <Dialog open={!!archiveTarget} onOpenChange={(v) => { if (!v) setArchiveTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Archivar lead
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas archivar a {archiveTarget?.name ?? 'este lead'}? Dejará de aparecer en la lista.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmArchive} disabled={isArchiving}>
              {isArchiving && <Loader2 className="size-4 animate-spin" />}
              Archivar
            </Button>
            <Button variant="outline" onClick={() => setArchiveTarget(null)} disabled={isArchiving}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadsFilterBar
        search={search.search ?? ''}
        onSearchChange={(v) => updateSearch({ search: v || undefined })}
        status={search.status}
        onStatusChange={(v) => updateSearch({ status: v })}
        assignedTo={search.assigned_to}
        onAssignedToChange={(v) => updateSearch({ assigned_to: v })}
        agentOptions={agentOptions}
        right={
          !isMobile && (
            <ViewToggle view={search.view} onChange={(v) => navigate({ search: (prev) => ({ ...prev, view: v }) })} />
          )
        }
      />

      {effectiveView === 'kanban' ? (
        <LeadsKanbanView
          leads={leads}
          isLoading={isLoading}
          error={!!fetchError}
          agentNameById={agentNameById}
          onView={(lead) => setViewLeadId(lead.id)}
          onEdit={setEditLead}
          onArchive={setArchiveTarget}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <LeadsTableView
          leads={leads}
          isLoading={isLoading}
          error={!!fetchError}
          agentNameById={agentNameById}
          isMobile={isMobile}
          sorting={sorting}
          onSortingChange={setSorting}
          page={search.page}
          pageCount={data?.meta.pageCount}
          itemCount={data?.meta.itemCount}
          limit={TABLE_LIMIT}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
          onView={(lead) => setViewLeadId(lead.id)}
          onEdit={setEditLead}
          onArchive={setArchiveTarget}
          bulkArchiving={bulkArchiving}
          onBulkArchive={handleBulkArchive}
          resetSelectionKeys={[search.page, search.search, search.status, search.assigned_to, sortBy, sortOrder]}
        />
      )}
    </div>
  )
}

export default TenantLeadsPage
