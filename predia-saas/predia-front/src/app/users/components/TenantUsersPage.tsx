import { useId, useState } from 'react'
import { Loader2, Plus, ChevronDown, ChevronUp, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useUsers, useCreateUser } from '@/app/users/hooks'
import type { CreateUserRequest } from '@/app/users/types'

const PAGE_LIMIT = 20

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  agent: 'Agente',
}

const ROLE_VARIANT: Record<string, 'emerald' | 'orange'> = {
  admin: 'emerald',
  agent: 'orange',
}

const EMPTY_FORM: CreateUserRequest = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'agent',
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Error al crear el usuario. Intenta nuevamente.'
}

function TenantUsersPage() {
  const errorId = useId()
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<CreateUserRequest>(EMPTY_FORM)
  const [created, setCreated] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, error: fetchError } = useUsers({ page, limit: PAGE_LIMIT })
  const { mutate: createUser, isPending, error: createError, reset } = useCreateUser()

  const users = data?.data ?? []
  const errorMessage = createError ? extractMessage(createError) : null

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleRoleChange(value: string) {
    setForm(prev => ({ ...prev, role: value as 'admin' | 'agent' }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    createUser(form, {
      onSuccess: () => {
        setCreated(`${form.first_name} ${form.last_name}`)
        setForm(EMPTY_FORM)
        reset()
        setShowForm(false)
      },
    })
  }

  function handleNew() {
    setCreated(null)
    setShowForm(true)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Usuarios</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Administra los usuarios de tu organización.
          </Text>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nuevo usuario
          {showForm ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-canvas rounded-2xl border border-hairline shadow-raised p-8">
          <div className="mb-6 pb-5 border-b border-hairline">
            <Text as="md" className="font-semibold text-foreground">Nuevo usuario</Text>
            <Text as="sm" className="text-muted-foreground mt-1">
              Asigna rol de administrador o agente.
            </Text>
          </div>

          {created ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="size-14 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div className="space-y-1.5">
                <Heading as="md">Usuario creado</Heading>
                <Text as="sm" className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{created}</span> ya tiene acceso.
                </Text>
              </div>
              <Button className="mt-4" onClick={handleNew}>
                Crear otro usuario
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {errorMessage && (
                <div
                  id={errorId}
                  role="alert"
                  className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-4 py-3 text-sm"
                >
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input id="first_name" name="first_name" placeholder="Juan"
                    value={form.first_name} onChange={handleChange} required autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input id="last_name" name="last_name" placeholder="Pérez"
                    value={form.last_name} onChange={handleChange} required autoComplete="off" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" placeholder="usuario@correo.com"
                  value={form.email} onChange={handleChange} required autoComplete="off" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <Select value={form.role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password} onChange={handleChange}
                    required autoComplete="new-password" className="pr-9" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="px-8">
                  {isPending && <Loader2 className="animate-spin mr-2" />}
                  Crear usuario
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Users table */}
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
            <Text as="sm" className="text-muted-foreground">No hay usuarios en esta organización.</Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Rol</th>
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

export default TenantUsersPage
