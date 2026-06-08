import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { useAllUsers, useCreateSuperAdmin } from '@/app/admin/hooks'
import { createSuperAdminSchema, type CreateSuperAdminFormValues } from '@/app/admin/types/create-super-admin.schema'
import type { CreateSuperAdminRequest, UserWithTenant } from '@/app/admin/services/system.service'

const DEFAULT_LIMIT = 20

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
  colHelper.display({
    id: 'tenant',
    header: 'Organización',
    cell: (info) => (
      <>
        <span className="font-mono text-xs text-muted-foreground">
          {info.row.original.tenant.slug}
        </span>
        <span className="ml-1 text-muted-foreground"> · {info.row.original.tenant.name}</span>
      </>
    ),
  }),
  colHelper.accessor('created_at', {
    header: 'Creado',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
    meta: { className: 'text-muted-foreground' },
  }),
]

function UsersAdminPage() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const { data, isLoading, error: fetchError } = useAllUsers({ page, limit })
  const { mutate: createSuperAdmin, isPending } = useCreateSuperAdmin()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
    } satisfies CreateSuperAdminFormValues,
    validators: {
      onSubmit: createSuperAdminSchema,
    },
    onSubmit: ({ value }: { value: CreateSuperAdminFormValues }) => {
      createSuperAdmin(value as CreateSuperAdminRequest, {
        onSuccess: () => { setOpen(false); form.reset() },
      })
    },
  })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  const users = data?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Usuarios del sistema</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Todos los usuarios registrados en la plataforma.
          </Text>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nuevo superadmin
        </Button>
      </div>

      <FormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) form.reset()
        }}
        title="Nuevo superadmin"
        description="El usuario tendrá acceso completo al sistema."
        onSubmit={handleFormSubmit}
        isSubmitting={isPending}
        submitLabel="Crear superadmin"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="first_name">
            {(field) => (
              <FormField field={field} label="Nombre">
                <Input id="first_name" placeholder="Juan" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
          <form.Field name="last_name">
            {(field) => (
              <FormField field={field} label="Apellido">
                <Input id="last_name" placeholder="Pérez" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
        </div>

        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico">
              <Input id="email" type="email" placeholder="admin@predia.com" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField field={field} label="Contraseña">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 12 caracteres"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>
          )}
        </form.Field>
      </FormSheet>

      <div className="bg-canvas rounded-2xl border border-hairline shadow-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <Text as="md" className="font-semibold">
            Usuarios
            {data && (
              <span className="ml-2 text-muted-foreground font-normal text-sm">
                ({data.meta?.itemCount ?? users.length})
              </span>
            )}
          </Text>
        </div>
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          error={!!fetchError}
          emptyMessage="No hay usuarios registrados."
          pagination={data?.meta ? {
            page,
            pageCount: data.meta.pageCount,
            itemCount: data.meta.itemCount,
            limit,
            onPageChange: setPage,
            onLimitChange: (l) => { setLimit(l); setPage(1) },
          } : undefined}
        />
      </div>
    </div>
  )
}

export default UsersAdminPage
