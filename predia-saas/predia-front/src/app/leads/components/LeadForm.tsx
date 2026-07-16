import { useForm } from '@tanstack/react-form'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { editLeadSchema } from '@/app/leads/types/create-lead.schema'
import type { CreateLeadRequest, Lead, LeadSource, LeadStatus, UpdateLeadRequest } from '@/app/leads/types'
import { EDITABLE_STATUSES, NONE_VALUE, SOURCE_LABEL } from '@/app/leads/constants'
import PropertyCombobox from '@/app/leads/components/PropertyCombobox'

type AgentOption = { id: string; label: string }

interface LeadFormProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  isSubmitting: boolean
  agentOptions: AgentOption[]
  isAdmin: boolean
  onCreate?: (values: CreateLeadRequest) => void
  onEdit?: (id: string, values: UpdateLeadRequest) => void
}

function LeadForm({
  mode,
  open,
  onOpenChange,
  lead,
  isSubmitting,
  agentOptions,
  isAdmin,
  onCreate,
  onEdit,
}: LeadFormProps) {
  const isEdit = mode === 'edit'

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
    // editLeadSchema always validates (create and edit share defaultValues,
    // including `status`, which always has a valid default even in create
    // mode where it's simply not sent to the API).
    validators: {
      onChange: editLeadSchema,
      onSubmit: editLeadSchema,
    },
    onSubmit: ({ value }) => {
      const payload = {
        name: value.name.trim(),
        email: value.email.trim() || undefined,
        phone: value.phone.trim() || undefined,
        source: value.source,
        assigned_to: value.assigned_to || undefined,
        property_id: value.property_id || undefined,
        notes: value.notes.trim() || undefined,
      }
      if (isEdit && lead) {
        onEdit?.(lead.id, { ...payload, status: value.status })
      } else {
        onCreate?.(payload as CreateLeadRequest)
      }
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
      onOpenChange={(v) => { onOpenChange(v); if (!v && !isEdit) form.reset() }}
      title={isEdit ? 'Editar lead' : 'Nuevo lead'}
      description={isEdit ? 'Actualiza los datos y el estado del lead.' : 'Registra un cliente potencial.'}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Guardar cambios' : 'Crear lead'}
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" hint="Ejemplo: María Rodríguez.">
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoComplete="off"
            />
          </FormField>
        )}
      </form.Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico" optional>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoComplete="off"
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <FormField field={field} label="Teléfono" optional>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoComplete="off"
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="source">
          {(field) => (
            <FormField field={field} label="Fuente">
              <Select
                value={field.state.value}
                onValueChange={(v: LeadSource) => field.handleChange(v)}
                onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
              >
                <SelectTrigger id={field.name}>
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

        {isEdit && (
          <form.Field name="status">
            {(field) => (
              <FormField field={field} label="Estado">
                <Select
                  value={field.state.value}
                  onValueChange={(v: LeadStatus) => field.handleChange(v)}
                  onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
                >
                  <SelectTrigger id={field.name}>
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
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isAdmin && (
          <form.Field name="assigned_to">
            {(field) => (
              <FormField field={field} label="Agente asignado" optional>
                <Select
                  value={field.state.value || NONE_VALUE}
                  onValueChange={(v) => field.handleChange(v === NONE_VALUE ? '' : v)}
                >
                  <SelectTrigger id={field.name}>
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
        )}
        <form.Field name="property_id">
          {(field) => (
            <FormField field={field} label="Propiedad de interés" optional>
              <PropertyCombobox
                id={field.name}
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <FormField field={field} label="Notas" optional>
            <Textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
            />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

export default LeadForm
