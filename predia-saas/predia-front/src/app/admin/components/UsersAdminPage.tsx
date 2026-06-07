import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Loader2, Plus, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/design-system/ui/form-field'
import { useAllUsers, useCreateSuperAdmin } from '@/app/admin/hooks'
import { createSuperAdminSchema, type CreateSuperAdminFormValues } from '@/app/admin/types/create-super-admin.schema'
import type { CreateSuperAdminRequest } from '@/app/admin/services/system.service'

const PAGE_LIMIT = 20

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

function UsersAdminPage() {
  const [open, setOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [page, setPage] = useState(1)

  const { data, isLoading, error: fetchError } = useAllUsers({ page, limit: PAGE_LIMIT })
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
              <FormField label="Nombre" htmlFor="first_name" error={field.state.meta.errors[0]?.message}>
                <Input id="first_name" placeholder="Juan" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
          <form.Field name="last_name">
            {(field) => (
              <FormField label="Apellido" htmlFor="last_name" error={field.state.meta.errors[0]?.message}>
                <Input id="last_name" placeholder="Pérez" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
              </FormField>
            )}
          </form.Field>
        </div>

        <form.Field name="email">
          {(field) => (
            <FormField label="Correo electrónico" htmlFor="email" error={field.state.meta.errors[0]?.message}>
              <Input id="email" type="email" placeholder="admin@predia.com" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} onBlur={field.handleBlur} autoComplete="off" />
            </FormField>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <FormField label="Contraseña" htmlFor="password" error={field.state.meta.errors[0]?.message}>
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

      {/* Users table */}
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

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : fetchError ? (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-destructive">Error al cargar los usuarios.</Text>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-muted-foreground">No hay usuarios registrados.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Organización</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={user.id} className={i !== users.length - 1 ? 'border-b border-hairline' : ''}>
                    <td className="px-6 py-4 font-medium">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={ROLE_VARIANT[user.role] ?? 'default'}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-muted-foreground">{user.tenant.slug}</span>
                      <span className="ml-1 text-muted-foreground"> · {user.tenant.name}</span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('es-CR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.meta && (
          <PaginationControls
            page={page}
            pageCount={data.meta.pageCount}
            itemCount={data.meta.itemCount}
            limit={PAGE_LIMIT}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  )
}

export default UsersAdminPage
