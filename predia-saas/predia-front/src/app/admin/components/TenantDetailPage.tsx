import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { ArrowLeft, Images, Pencil } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Card, CardContent } from '@/design-system/ui/card'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { DataTable } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { useTenant, useUpdateTenant } from '@/app/tenants/hooks'
import { useUsersByTenant } from '@/app/admin/hooks'
import {
  updateTenantSettingsSchema,
  type UpdateTenantSettingsFormValues,
} from '@/app/tenants/types/update-tenant-settings.schema'
import type { Tenant } from '@/app/tenants/types'
import type { UserWithTenant } from '@/app/admin/services/system.service'

const DEFAULT_LIMIT = 15

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Superadmin',
  admin: 'Admin',
  agent: 'Agente',
}

const ROLE_VARIANT: Record<string, 'default' | 'emerald' | 'orange'> = {
  super_admin: 'default',
  admin: 'emerald',
  agent: 'orange',
}

const colHelper = createColumnHelper<UserWithTenant>()

const columns = [
  colHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
    id: 'name',
    header: 'Nombre',
    meta: { className: 'font-medium' },
  }),
  colHelper.accessor('email', {
    header: 'Email',
    meta: { className: 'text-muted-foreground' },
  }),
  colHelper.accessor('role', {
    header: 'Rol',
    cell: (info) => (
      <Badge variant={ROLE_VARIANT[info.getValue()] ?? 'default'}>
        {ROLE_LABEL[info.getValue()] ?? info.getValue()}
      </Badge>
    ),
  }),
  colHelper.accessor('created_at', {
    header: 'Creado',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
    meta: { className: 'text-muted-foreground' },
  }),
]

// ─── Configuración: límite de imágenes por propiedad ───────────────────────

function TenantSettingsCard({ tenant }: { tenant: Tenant }) {
  const [open, setOpen] = useState(false)
  const { mutate: updateTenant, isPending } = useUpdateTenant()

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-muted-foreground">
                <Images className="size-4" />
              </div>
              <div className="min-w-0">
                <Text as="sm" className="font-semibold text-foreground">
                  Límite de imágenes por propiedad
                </Text>
                <Text as="sm" className="text-muted-foreground">
                  Máximo de fotos que un agente puede subir por cada propiedad, según el plan.
                </Text>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="shrink-0 gap-1.5">
              <Pencil className="size-3.5" />
              Editar
            </Button>
          </div>

          <div className="mt-4 flex items-baseline gap-1.5 pl-12">
            <span className="font-display text-3xl font-semibold tabular-nums text-foreground">
              {tenant.max_images_per_property}
            </span>
            <Text as="sm" className="text-muted-foreground">
              imágenes por propiedad
            </Text>
          </div>
        </CardContent>
      </Card>

      <TenantSettingsFormSheet
        key={tenant.id}
        tenant={tenant}
        open={open}
        onOpenChange={setOpen}
        isPending={isPending}
        updateTenant={updateTenant}
      />
    </>
  )
}

function TenantSettingsFormSheet({
  tenant,
  open,
  onOpenChange,
  isPending,
  updateTenant,
}: {
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  updateTenant: ReturnType<typeof useUpdateTenant>['mutate']
}) {
  const form = useForm({
    defaultValues: {
      maxImagesPerProperty: String(tenant.max_images_per_property),
    } satisfies UpdateTenantSettingsFormValues,
    validators: {
      onSubmit: updateTenantSettingsSchema,
    },
    onSubmit: ({ value }: { value: UpdateTenantSettingsFormValues }) => {
      updateTenant(
        { id: tenant.id, max_images_per_property: Number(value.maxImagesPerProperty) },
        { onSuccess: () => onOpenChange(false) },
      )
    },
  })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
      title="Límite de imágenes"
      description="Ajusta cuántas fotos puede tener cada propiedad de esta organización."
      onSubmit={handleFormSubmit}
      isSubmitting={isPending}
      submitLabel="Guardar cambios"
    >
      <form.Field name="maxImagesPerProperty">
        {(field) => (
          <FormField field={field} label="Máximo de imágenes por propiedad" hint="Debe ser un número entero, mínimo 1.">
            <Input
              id="maxImagesPerProperty"
              type="number"
              min={1}
              step={1}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

function TenantDetailPage({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT
  const { data: tenant, isLoading: loadingTenant } = useTenant(tenantId)
  const { data, isLoading: loadingUsers, error } = useUsersByTenant(tenantId, { page, limit })

  const users = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Volver a organizaciones
        </Link>

        <div className="flex flex-col gap-1">
          {loadingTenant ? (
            <div className="h-8 w-48 animate-pulse rounded bg-surface-strong/40" />
          ) : (
            <>
              <Heading as="lg">{tenant?.name ?? 'Organización'}</Heading>
              <Text as="sm" className="text-muted-foreground font-mono">{tenant?.slug}</Text>
            </>
          )}
        </div>
      </div>

      {tenant && <TenantSettingsCard tenant={tenant} />}

      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <DataTable
          columns={columns}
          data={users}
          isLoading={loadingUsers}
          error={!!error}
          emptyMessage="Esta organización no tiene usuarios aún."
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

export default TenantDetailPage
