import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm, useStore } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Badge } from '@/design-system/ui/badge'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { useTenants, useCreateTenant } from '@/app/tenants/hooks'
import { createTenantSchema, type CreateTenantFormValues } from '@/app/tenants/types/create-tenant.schema'
import type { SubscriptionStatus, Tenant } from '@/app/tenants/types'

const DEFAULT_LIMIT = 15

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'Prueba',
  active: 'Activo',
  past_due: 'Vencido',
  cancelled: 'Cancelado',
}

const STATUS_VARIANT: Record<SubscriptionStatus, 'default' | 'emerald' | 'orange' | 'pink'> = {
  trial: 'default',
  active: 'emerald',
  past_due: 'orange',
  cancelled: 'pink',
}

const colHelper = createColumnHelper<Tenant>()

const columns = [
  colHelper.accessor('name', {
    header: 'Nombre',
    meta: { className: 'font-medium' },
  }),
  colHelper.accessor('slug', {
    header: 'Slug',
    cell: (info) => <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>,
  }),
  colHelper.accessor('subscription_status', {
    header: 'Estado',
    cell: (info) => (
      <Badge variant={STATUS_VARIANT[info.getValue()]}>
        {STATUS_LABEL[info.getValue()]}
      </Badge>
    ),
  }),
  colHelper.accessor('created_at', {
    header: 'Creado',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
    meta: { className: 'text-muted-foreground' },
  }),
  colHelper.display({
    id: 'actions',
    header: '',
    meta: { headerClassName: 'px-6 py-4', className: 'text-right' },
    cell: (info) => (
      <Link
        to="/admin/tenants/$id"
        params={{ id: info.row.original.id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Users className="size-3.5" />
        Usuarios
      </Link>
    ),
  }),
]

function TenantsPage() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT

  const { mutate: createTenant, isPending } = useCreateTenant()
  const { data: tenantsData, isLoading: loadingTenants } = useTenants({ page, limit })

  const form = useForm({
    defaultValues: {
      tenantName: '',
      tenantSlug: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    } satisfies CreateTenantFormValues,
    validators: {
      onSubmit: createTenantSchema,
    },
    onSubmit: ({ value }: { value: CreateTenantFormValues }) => {
      createTenant({
        ...value,
        tenantName: value.tenantName.trim(),
        tenantSlug: value.tenantSlug.trim(),
        email: value.email.trim(),
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
      }, {
        onSuccess: () => { setOpen(false); form.reset() },
      })
    },
  })

  const formName = useStore(form.store, (state) => state.values.tenantName)

  useEffect(() => {
    const slug = slugify(formName ?? '')
    form.setFieldValue('tenantSlug', slug, { dontValidate: true })
  }, [formName, form])

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  const tenants: Tenant[] = tenantsData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Organizaciones</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona los tenants de la plataforma.
          </Text>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva organización
        </Button>
      </div>

      <FormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) form.reset()
        }}
        title="Nueva organización"
        description="Crea un nuevo tenant y su asesor principal."
        onSubmit={handleFormSubmit}
        isSubmitting={isPending}
        submitLabel="Crear organización"
      >
        <form.Field name="tenantName">
          {(field) => (
            <FormField field={field} label="Nombre de la inmobiliaria" hint="Ejemplo: Inmobiliaria Norte.">
              <Input id="tenantName" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="tenantSlug">
          {(field) => (
            <FormField field={field} label="Identificador único" hint="Usá minúsculas, números y guiones. Ejemplo: inmobiliaria-norte.">
              <Input id="tenantSlug" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <hr className="border-hairline" />

        <Text as="sm" className="font-semibold text-foreground">
          Asesor principal
        </Text>

        <form.Field name="firstName">
          {(field) => (
            <FormField field={field} label="Nombre" hint="Ejemplo: Carlos.">
              <Input id="firstName" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="given-name" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <FormField field={field} label="Apellido" hint="Ejemplo: Mendoza.">
              <Input id="lastName" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="family-name" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico" hint="Ejemplo: asesor@inmobiliaria.com.">
              <Input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="email" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField field={field} label="Contraseña" hint="Mínimo 8 caracteres.">
              <Input id="password" type="password" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="new-password" />
            </FormField>
          )}
        </form.Field>
      </FormSheet>

      {/* Tenants list */}
      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <DataTable
          columns={columns}
          data={tenants}
          isLoading={loadingTenants}
          emptyState={
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Text as="sm" className="text-muted-foreground">No hay organizaciones registradas aún.</Text>
              <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                <Plus className="size-4 mr-1" /> Crear primera organización
              </Button>
            </div>
          }
        />
      </div>

      {tenantsData?.meta && (
        <PaginationControls
          page={page}
          pageCount={tenantsData.meta.pageCount}
          itemCount={tenantsData.meta.itemCount}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default TenantsPage
