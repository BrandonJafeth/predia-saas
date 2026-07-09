import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { AlertTriangle, Loader2, MoreHorizontal, Plus, PencilLine, Archive } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
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
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable, createSelectionColumn } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { useUsers } from '@/app/users/hooks'
import { useProperties } from '@/app/properties/hooks'
import { useLeads, useCreateLead, useUpdateLead, useArchiveLead } from '@/app/leads/hooks'
import { createLeadSchema, editLeadSchema } from '@/app/leads/types/create-lead.schema'
import {
  leadKeys,
  type CreateLeadRequest,
  type Lead,
  type LeadSource,
  type LeadStatus,
  type UpdateLeadRequest,
} from '@/app/leads/types'
import { leadsService } from '@/app/leads/services/leads.service'
import { notify } from '@/shared/lib/notifications'

const DEFAULT_LIMIT = 15
const NONE_VALUE = '__none__'

type AgentOption = { id: string; label: string }
type PropertyOption = { id: string; label: string }

const SOURCE_LABEL: Record<LeadSource, string> = {
  web: 'Web',
  referral: 'Referido',
  walk_in: 'Visita',
  social: 'Redes sociales',
  other: 'Otro',
}

const SOURCE_VARIANT: Record<LeadSource, 'default' | 'orange' | 'pink' | 'violet' | 'emerald'> = {
  web: 'violet',
  referral: 'emerald',
  walk_in: 'orange',
  social: 'pink',
  other: 'default',
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  won: 'Ganado',
  lost: 'Perdido',
  archived: 'Archivado',
}

const STATUS_VARIANT: Record<LeadStatus, 'default' | 'orange' | 'pink' | 'violet' | 'emerald'> = {
  new: 'violet',
  contacted: 'orange',
  qualified: 'orange',
  proposal: 'pink',
  negotiation: 'pink',
  won: 'emerald',
  lost: 'default',
  archived: 'default',
}

const EDITABLE_STATUSES = (
  ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as LeadStatus[]
).map((value) => ({ label: STATUS_LABEL[value], value }))

const STATUS_FILTER_OPTIONS = EDITABLE_STATUSES

// --- CreateLeadSheet ---

interface CreateLeadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  agentOptions: AgentOption[]
  propertyOptions: PropertyOption[]
  onCreate: (values: CreateLeadRequest) => void
}

function CreateLeadSheet({
  open,
  onOpenChange,
  isSubmitting,
  agentOptions,
  propertyOptions,
  onCreate,
}: CreateLeadSheetProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      source: 'other' as LeadSource,
      assigned_to: '',
      property_id: '',
      notes: '',
    },
    validators: { onSubmit: createLeadSchema },
    onSubmit: ({ value }) => {
      onCreate({
        name: value.name.trim(),
        email: value.email.trim() || undefined,
        phone: value.phone.trim() || undefined,
        source: value.source,
        assigned_to: value.assigned_to || undefined,
        property_id: value.property_id || undefined,
        notes: value.notes.trim() || undefined,
      } as CreateLeadRequest)
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset() }}
      title="Nuevo lead"
      description="Registra un cliente potencial."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Crear lead"
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" hint="Ejemplo: María Rodríguez.">
            <Input id="name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico" optional>
              <Input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <FormField field={field} label="Teléfono" optional>
              <Input id="phone" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="source">
        {(field) => (
          <FormField field={field} label="Fuente">
            <Select value={field.state.value} onValueChange={(v: LeadSource) => field.handleChange(v)} onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}>
              <SelectTrigger id="source">
                <SelectValue placeholder="Selecciona una fuente" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((value) => (
                  <SelectItem key={value} value={value}>{SOURCE_LABEL[value]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="assigned_to">
          {(field) => (
            <FormField field={field} label="Agente asignado" optional>
              <Select value={field.state.value || NONE_VALUE} onValueChange={(v) => field.handleChange(v === NONE_VALUE ? '' : v)}>
                <SelectTrigger id="assigned_to">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin asignar</SelectItem>
                  {agentOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
        <form.Field name="property_id">
          {(field) => (
            <FormField field={field} label="Propiedad" optional>
              <Select value={field.state.value || NONE_VALUE} onValueChange={(v) => field.handleChange(v === NONE_VALUE ? '' : v)}>
                <SelectTrigger id="property_id">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Ninguna</SelectItem>
                  {propertyOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <FormField field={field} label="Notas" optional>
            <Textarea id="notes" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} rows={3} />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

// --- EditLeadSheet ---

interface EditLeadSheetProps {
  open: boolean
  lead: Lead | null
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  agentOptions: AgentOption[]
  propertyOptions: PropertyOption[]
  onEdit: (id: string, values: UpdateLeadRequest) => void
}

function EditLeadSheet({
  open,
  lead,
  onOpenChange,
  isSubmitting,
  agentOptions,
  propertyOptions,
  onEdit,
}: EditLeadSheetProps) {
  const form = useForm({
    defaultValues: {
      name: lead?.name ?? '',
      email: lead?.email ?? '',
      phone: lead?.phone ?? '',
      source: (lead?.source ?? 'other') as LeadSource,
      status: (lead?.status ?? 'new') as LeadStatus,
      assigned_to: lead?.assigned_to ?? '',
      property_id: lead?.property_id ?? '',
      notes: lead?.notes ?? '',
    },
    validators: { onSubmit: editLeadSchema },
    onSubmit: ({ value }) => {
      if (!lead) return
      onEdit(lead.id, {
        name: value.name.trim(),
        email: value.email.trim() || undefined,
        phone: value.phone.trim() || undefined,
        source: value.source,
        status: value.status,
        assigned_to: value.assigned_to || undefined,
        property_id: value.property_id || undefined,
        notes: value.notes.trim() || undefined,
      })
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Editar lead"
      description="Actualiza los datos y el estado del lead."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Guardar cambios"
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" hint="Ejemplo: María Rodríguez.">
            <Input id="edit_name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico" optional>
              <Input id="edit_email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <FormField field={field} label="Teléfono" optional>
              <Input id="edit_phone" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="source">
          {(field) => (
            <FormField field={field} label="Fuente">
              <Select value={field.state.value} onValueChange={(v: LeadSource) => field.handleChange(v)} onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}>
                <SelectTrigger id="edit_source">
                  <SelectValue placeholder="Selecciona una fuente" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SOURCE_LABEL) as LeadSource[]).map((value) => (
                    <SelectItem key={value} value={value}>{SOURCE_LABEL[value]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => (
            <FormField field={field} label="Estado">
              <Select value={field.state.value} onValueChange={(v: LeadStatus) => field.handleChange(v)} onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}>
                <SelectTrigger id="edit_status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_STATUSES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="assigned_to">
          {(field) => (
            <FormField field={field} label="Agente asignado" optional>
              <Select value={field.state.value || NONE_VALUE} onValueChange={(v) => field.handleChange(v === NONE_VALUE ? '' : v)}>
                <SelectTrigger id="edit_assigned_to">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Sin asignar</SelectItem>
                  {agentOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
        <form.Field name="property_id">
          {(field) => (
            <FormField field={field} label="Propiedad" optional>
              <Select value={field.state.value || NONE_VALUE} onValueChange={(v) => field.handleChange(v === NONE_VALUE ? '' : v)}>
                <SelectTrigger id="edit_property_id">
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Ninguna</SelectItem>
                  {propertyOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <FormField field={field} label="Notas" optional>
            <Textarea id="edit_notes" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} rows={3} />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

// --- Columns factory ---

const colHelper = createColumnHelper<Lead>()

function createColumns(
  agentNameById: Map<string, string>,
  onEdit: (lead: Lead) => void,
  onArchive: (lead: Lead) => void,
) {
  return [
    createSelectionColumn<Lead>(),
    colHelper.accessor('name', {
      header: 'Nombre',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>,
    }),
    colHelper.accessor('email', {
      header: 'Email',
      enableSorting: false,
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('phone', {
      header: 'Teléfono',
      enableSorting: false,
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('source', {
      header: 'Fuente',
      cell: (info) => {
        const source = info.getValue()
        return <Badge variant={SOURCE_VARIANT[source]}>{SOURCE_LABEL[source]}</Badge>
      },
    }),
    colHelper.accessor('status', {
      header: 'Estado',
      cell: (info) => {
        const status = info.getValue()
        return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      },
      meta: { filterVariant: 'select', filterOptions: STATUS_FILTER_OPTIONS },
      filterFn: 'equals',
    }),
    colHelper.accessor('assigned_to', {
      header: 'Agente',
      enableSorting: false,
      cell: (info) => {
        const id = info.getValue()
        return (
          <span className="text-muted-foreground">
            {id ? agentNameById.get(id) ?? 'Agente desconocido' : 'Sin asignar'}
          </span>
        )
      },
    }),
    colHelper.accessor('created_at', {
      header: 'Creado',
      cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
      meta: { className: 'text-muted-foreground' },
    }),
    colHelper.display({
      id: 'actions',
      enableSorting: false,
      header: () => null,
      cell: (info) => {
        const lead = info.row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(lead)}>
                <PencilLine />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onArchive(lead)}>
                <Archive />
                <span>Archivar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ]
}

// --- TenantLeadsPage ---

function TenantLeadsPage() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | undefined>(undefined)
  const [sorting, setSorting] = useState<SortingState>([])
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Lead | null>(null)
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const limit = DEFAULT_LIMIT

  const queryClient = useQueryClient()
  const sortBy = sorting[0]?.id as 'name' | 'status' | 'source' | 'created_at' | undefined
  const sortOrder = sorting[0] ? (sorting[0].desc ? 'desc' : 'asc') : undefined

  const { data, isLoading, error: fetchError } = useLeads({
    page,
    limit,
    search: search || undefined,
    status: statusFilter,
    sortBy,
    sortOrder,
  })
  const { data: agentsData } = useUsers({ limit: 100 })
  const { data: propertiesData } = useProperties({ limit: 100 })
  const { mutate: createLead, isPending: isCreating } = useCreateLead()
  const { mutate: updateLead, isPending: isUpdating } = useUpdateLead()
  const { mutate: archiveLead, isPending: isArchiving } = useArchiveLead()

  const agentOptions: AgentOption[] = (agentsData?.data ?? []).map((u) => ({
    id: u.id,
    label: `${u.first_name} ${u.last_name}`,
  }))
  const agentNameById = new Map(agentOptions.map((a) => [a.id, a.label]))
  const propertyOptions: PropertyOption[] = (propertiesData?.data ?? []).map((p) => ({
    id: p.id,
    label: p.title,
  }))

  const columns = createColumns(agentNameById, setEditLead, setArchiveTarget)

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

      <CreateLeadSheet
        open={open}
        onOpenChange={setOpen}
        isSubmitting={isCreating}
        agentOptions={agentOptions}
        propertyOptions={propertyOptions}
        onCreate={(values) => createLead(values, { onSuccess: () => setOpen(false) })}
      />

      <EditLeadSheet
        key={editLead?.id ?? 'no-edit'}
        open={!!editLead}
        lead={editLead}
        onOpenChange={(v) => { if (!v) setEditLead(null) }}
        isSubmitting={isUpdating}
        agentOptions={agentOptions}
        propertyOptions={propertyOptions}
        onEdit={(id, values) => updateLead({ id, ...values }, { onSuccess: () => setEditLead(null) })}
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

      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft p-4">
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoading}
          error={!!fetchError}
          emptyMessage="No hay leads todavía."
          getRowId={(row) => row.id}
          enableSorting
          sorting={sorting}
          onSortingChange={(s) => { setSorting(s); setPage(1) }}
          enableGlobalFilter
          globalFilterPlaceholder="Buscar por nombre, email o teléfono..."
          globalFilter={search}
          onGlobalFilterChange={(v) => { setSearch(v); setPage(1) }}
          columnFilters={statusFilter ? [{ id: 'status', value: statusFilter }] : []}
          onColumnFiltersChange={(filters) => {
            const status = filters.find((f) => f.id === 'status')?.value as LeadStatus | undefined
            setStatusFilter(status)
            setPage(1)
          }}
          enableRowSelection
          resetSelectionKeys={[page, search, statusFilter, sortBy, sortOrder]}
          bulkActions={(rows, clearSelection) => (
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkArchiving}
              onClick={() => handleBulkArchive(rows, clearSelection)}
            >
              {bulkArchiving && <Loader2 className="size-4 animate-spin" />}
              Archivar seleccionados
            </Button>
          )}
        />
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
    </div>
  )
}

export default TenantLeadsPage
