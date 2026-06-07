import { useId, useState } from 'react'
import { Loader2, Plus, ChevronDown, ChevronUp, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useAllUsers, useCreateSuperAdmin } from '@/app/admin/hooks'
import type { CreateSuperAdminRequest } from '@/app/admin/services/system.service'

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

const EMPTY_FORM: CreateSuperAdminRequest = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Error al crear el superadmin. Intenta nuevamente.'
}

function UsersAdminPage() {
  const errorId = useId()
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<CreateSuperAdminRequest>(EMPTY_FORM)
  const [created, setCreated] = useState<string | null>(null)

  const { data, isLoading, error: fetchError } = useAllUsers({ limit: 50 })
  const { mutate: createSuperAdmin, isPending, error: createError, reset } = useCreateSuperAdmin()

  const users = data?.data ?? []
  const errorMessage = createError ? extractMessage(createError) : null

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    createSuperAdmin(form, {
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
          <Heading as="lg">Usuarios del sistema</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Todos los usuarios registrados en la plataforma.
          </Text>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nuevo superadmin
          {showForm ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {/* Create superadmin form */}
      {showForm && (
        <div className="bg-canvas rounded-2xl border border-hairline shadow-raised p-8">
          <div className="mb-6 pb-5 border-b border-hairline">
            <Text as="md" className="font-semibold text-foreground">Nuevo superadmin</Text>
            <Text as="sm" className="text-muted-foreground mt-1">
              El usuario tendrá acceso completo al sistema.
            </Text>
          </div>

          {created ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="size-14 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div className="space-y-1.5">
                <Heading as="md">Superadmin creado</Heading>
                <Text as="sm" className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{created}</span> ya tiene acceso al sistema.
                </Text>
              </div>
              <Button className="mt-4" onClick={handleNew}>
                Crear otro superadmin
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
                <Input id="email" name="email" type="email" placeholder="admin@predia.com"
                  value={form.email} onChange={handleChange} required autoComplete="off" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 12 caracteres"
                    value={form.password} onChange={handleChange}
                    required autoComplete="new-password" className="pr-9" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Text as="caption" className="text-muted-foreground">Mínimo 12 caracteres.</Text>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="px-8">
                  {isPending && <Loader2 className="animate-spin mr-2" />}
                  Crear superadmin
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
                      <span className="ml-1 text-muted-foreground">· {user.tenant.name}</span>
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
      </div>
    </div>
  )
}

export default UsersAdminPage
