import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Eye, EyeOff, MoreHorizontal, PencilLine, Ban, CircleCheck } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { UserStatusConfirmDialog } from '@/shared/components/user-status-confirm-dialog'
import { cn } from '@/shared/lib/utils'
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useSuspendUser,
  useActivateUser,
} from '@/app/users/hooks'
import { createUserSchema, type CreateUserFormValues } from '@/app/users/types/create-user.schema'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/app/users/types'

const DEFAULT_LIMIT = 15
const editUserSchema = createUserSchema.pick({
  first_name: true,
  last_name: true,
  role: true,
})

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  agent: 'Agente',
}

const ROLE_VARIANT: Record<string, 'emerald' | 'orange'> = {
  admin: 'emerald',
  agent: 'orange',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  invited: 'Invitado',
  deactivated: 'Desactivado',
}

const STATUS_VARIANT: Record<string, 'emerald' | 'orange' | 'violet' | 'pink' | 'default'> = {
  active: 'emerald',
  suspended: 'orange',
  invited: 'violet',
  deactivated: 'default',
}

type ConfirmAction = { user: User; action: 'suspend' | 'activate' }

// --- EditUserSheet ---

interface EditUserSheetProps {
  open: boolean
  user: User | null
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  onEdit: (id: string, values: { first_name: string; last_name: string; role: 'admin' | 'agent' }) => void
}

function EditUserSheet({ open, user, onOpenChange, isSubmitting, onEdit }: EditUserSheetProps) {
  const form = useForm({
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      role: (user?.role ?? 'agent') as 'admin' | 'agent',
    },
    validators: { onSubmit: editUserSchema },
    onSubmit: ({ value }) => {
      if (!user) return
      onEdit(user.id, {
        ...value,
        first_name: value.first_name.trim(),
        last_name: value.last_name.trim(),
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
      title="Editar usuario"
      description="Modifica los datos del usuario."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Guardar cambios"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field name="first_name">
          {(field) => (
            <FormField field={field} label="Nombre" hint="Ejemplo: Juan.">
              <Input
                id="edit_first_name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoComplete="off"
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="last_name">
          {(field) => (
            <FormField field={field} label="Apellido" hint="Ejemplo: Pérez.">
              <Input
                id="edit_last_name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                autoComplete="off"
              />
            </FormField>
          )}
        </form.Field>
      </div>
      <form.Field name="role">
        {(field) => (
          <FormField field={field} label="Rol">
            <Select
              value={field.state.value}
              onValueChange={(v: 'admin' | 'agent') => field.handleChange(v)}
              onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
            >
              <SelectTrigger id="edit_role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agente</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

// --- Columns factory ---

const colHelper = createColumnHelper<User>()

function createColumns(
  onEdit: (user: User) => void,
  onConfirm: (action: ConfirmAction) => void,
) {
  return [
    colHelper.accessor((row: User) => `${row.first_name} ${row.last_name}`, {
      id: 'name',
      header: 'Nombre',
      cell: (info) => (
        <span className={cn('font-medium', info.row.original.status === 'suspended' && 'opacity-50')}>
          {info.getValue()}
        </span>
      ),
    }),
    colHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <span className={cn('text-muted-foreground', info.row.original.status === 'suspended' && 'opacity-50')}>
          {info.getValue()}
        </span>
      ),
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
        return (
          <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
            {STATUS_LABEL[status] ?? status}
          </Badge>
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
              <DropdownMenuItem onSelect={() => onEdit(user)}>
                <PencilLine />
                <span>Editar</span>
              </DropdownMenuItem>
              {(isActive || isSuspended) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={isActive ? 'text-destructive focus:text-destructive' : undefined}
                    onSelect={() =>
                      onConfirm({ user, action: isSuspended ? 'activate' : 'suspend' })
                    }
                  >
                    {isSuspended ? <CircleCheck /> : <Ban />}
                    <span>{isSuspended ? 'Activar' : 'Suspender'}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ]
}

// --- TenantUsersPage ---

function TenantUsersPage() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const limit = DEFAULT_LIMIT
  const [editUser, setEditUser] = useState<User | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)

  const { data, isLoading, error: fetchError } = useUsers({ page, limit })
  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser()
  const { mutate: suspendUser, isPending: isSuspending } = useSuspendUser()
  const { mutate: activateUser, isPending: isActivating } = useActivateUser()

  const columns = createColumns(setEditUser, setConfirmAction)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'agent' as CreateUserFormValues['role'],
    },
    validators: {
      onSubmit: createUserSchema,
    },
    onSubmit: ({ value }: { value: CreateUserFormValues }) => {
      createUser({
        ...value,
        email: value.email.trim(),
        first_name: value.first_name.trim(),
        last_name: value.last_name.trim(),
      } as CreateUserRequest, {
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

  const users: User[] = data?.data ?? []
  const isSuspendAction = confirmAction?.action === 'suspend'
  const confirmUser = confirmAction?.user

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Usuarios</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Administra los usuarios de tu organización.
          </Text>
        </div>
        <Button onClick={() => setOpen(true)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {/* Crear usuario */}
      <FormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) form.reset()
        }}
        title="Nuevo usuario"
        description="Asigna rol de administrador o agente."
        onSubmit={handleFormSubmit}
        isSubmitting={isCreating}
        submitLabel="Crear usuario"
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
            <FormField field={field} label="Correo electrónico" hint="Ejemplo: usuario@correo.com.">
              <Input id="email" type="email" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <FormField field={field} label="Rol">
              <Select
                value={field.state.value}
                onValueChange={(v: 'admin' | 'agent') => field.handleChange(v)}
                onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agente</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField field={field} label="Contraseña" hint="Mínimo 8 caracteres.">
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

      {/* Editar usuario — remount con key para reiniciar el form cuando cambia el usuario */}
      <EditUserSheet
        key={editUser?.id ?? 'no-edit'}
        open={!!editUser}
        user={editUser}
        onOpenChange={(v) => { if (!v) setEditUser(null) }}
        isSubmitting={isUpdating}
        onEdit={(id, values) =>
          updateUser(
            { id, ...values } as UpdateUserRequest & { id: string },
            { onSuccess: () => setEditUser(null) },
          )
        }
      />

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
          emptyMessage="No hay usuarios en esta organización."
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

export default TenantUsersPage
