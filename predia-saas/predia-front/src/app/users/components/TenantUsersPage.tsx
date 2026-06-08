import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { createColumnHelper } from '@tanstack/react-table'
import { Plus, Eye, EyeOff } from 'lucide-react'
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
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { DataTable } from '@/shared/components/data-table'
import { useUsers, useCreateUser } from '@/app/users/hooks'
import { createUserSchema, type CreateUserFormValues } from '@/app/users/types/create-user.schema'
import type { CreateUserRequest, User } from '@/app/users/types'

const DEFAULT_LIMIT = 20

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  agent: 'Agente',
}

const ROLE_VARIANT: Record<string, 'emerald' | 'orange'> = {
  admin: 'emerald',
  agent: 'orange',
}

const colHelper = createColumnHelper<User>()

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

function TenantUsersPage() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const { data, isLoading, error: fetchError } = useUsers({ page, limit })
  const { mutate: createUser, isPending } = useCreateUser()

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
      createUser(value as CreateUserRequest, {
        onSuccess: () => { setOpen(false); form.reset() },
      })
    },
  })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  const users: User[] = data?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
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

      <FormSheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) form.reset()
        }}
        title="Nuevo usuario"
        description="Asigna rol de administrador o agente."
        onSubmit={handleFormSubmit}
        isSubmitting={isPending}
        submitLabel="Crear usuario"
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
              <Input id="email" type="email" placeholder="usuario@correo.com" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="role">
          {(field) => (
            <FormField field={field} label="Rol">
              <Select
                value={field.state.value}
                onValueChange={(v: 'admin' | 'agent') => field.handleChange(v)}
                onOpenChange={(open) => { if (!open) field.handleBlur() }}
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
            <FormField field={field} label="Contraseña">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
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
            Miembros
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
          emptyMessage="No hay usuarios en esta organización."
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

export default TenantUsersPage
