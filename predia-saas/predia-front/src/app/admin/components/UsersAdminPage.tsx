import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Eye, EyeOff, MoreHorizontal, Ban, CircleCheck } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { UserStatusConfirmDialog } from '@/shared/components/user-status-confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { useAllUsers, useCreateSuperAdmin, useSystemSuspendUser, useSystemActivateUser } from '@/app/admin/hooks'
import { createSuperAdminSchema, type CreateSuperAdminFormValues } from '@/app/admin/types/create-super-admin.schema'
import type { CreateSuperAdminRequest, UserWithTenant } from '@/app/admin/services/system.service'

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

type ConfirmAction = { user: UserWithTenant; action: 'suspend' | 'activate' }

const colHelper = createColumnHelper<UserWithTenant>()

function createColumns(onConfirm: (ca: ConfirmAction) => void) {
  return [
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
    colHelper.accessor('status', {
      header: 'Estado',
      cell: (info) => {
        const status = info.getValue()
        const color = status === 'active' ? 'emerald' : status === 'suspended' ? 'orange' : 'default'
        return <Badge variant={color}>{status === 'active' ? 'Activo' : status === 'suspended' ? 'Suspendido' : status}</Badge>
      },
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
    colHelper.display({
      id: 'actions',
      header: () => null,
      cell: (info) => {
        const user = info.row.original
        const isSuspended = user.status === 'suspended'
        const isActive = user.status === 'active'
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(isActive || isSuspended) && (
                <DropdownMenuItem
                  className={isActive ? 'text-destructive focus:text-destructive' : undefined}
                  onSelect={() =>
                    onConfirm({ user, action: isSuspended ? 'activate' : 'suspend' })
                  }
                >
                  {isSuspended ? <CircleCheck /> : <Ban />}
                  <span>{isSuspended ? 'Activar' : 'Suspender'}</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ]
}

function UsersAdminPage() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const { data, isLoading, error: fetchError } = useAllUsers({ page, limit })
  const { mutate: createSuperAdmin, isPending } = useCreateSuperAdmin()
  const { mutate: suspendUser, isPending: isSuspending } = useSystemSuspendUser()
  const { mutate: activateUser, isPending: isActivating } = useSystemActivateUser()

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
      createSuperAdmin({
        ...value,
        email: value.email.trim(),
        first_name: value.first_name.trim(),
        last_name: value.last_name.trim(),
      } as CreateSuperAdminRequest, {
        onSuccess: () => { setOpen(false); form.reset() },
      })
    },
  })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  function handleConfirm() {
    if (!confirmAction) return
    if (confirmAction.action === 'suspend') {
      suspendUser(confirmAction.user.id, { onSuccess: () => setConfirmAction(null) })
    } else {
      activateUser(confirmAction.user.id, { onSuccess: () => setConfirmAction(null) })
    }
  }

  const columns = createColumns(setConfirmAction)
  const users = data?.data ?? []
  const isSuspendAction = confirmAction?.action === 'suspend'
  const confirmUser = confirmAction?.user

  return (
    <div className="space-y-6">
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
              <FormField field={field} label="Nombre" hint="Ejemplo: Juan.">
                <Input id="first_name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
          <form.Field name="last_name">
            {(field) => (
              <FormField field={field} label="Apellido" hint="Ejemplo: Pérez.">
                <Input id="last_name" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
        </div>

        <form.Field name="email">
          {(field) => (
            <FormField field={field} label="Correo electrónico" hint="Ejemplo: admin@predia.com.">
              <Input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField field={field} label="Contraseña" hint="Mínimo 12 caracteres.">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
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

      <UserStatusConfirmDialog
        open={!!confirmAction}
        action={isSuspendAction ? 'suspend' : 'activate'}
        userName={confirmUser ? `${confirmUser.first_name} ${confirmUser.last_name}` : 'este usuario'}
        isPending={isSuspending || isActivating}
        onOpenChange={(open) => { if (!open) setConfirmAction(null) }}
        onConfirm={handleConfirm}
      />

      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          error={!!fetchError}
          emptyMessage="No hay usuarios registrados."
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

export default UsersAdminPage
