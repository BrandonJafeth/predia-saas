import { useId, useState } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { Badge } from '@/design-system/ui/badge'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useRegister } from '@/app/auth/hooks'
import { useTenants } from '@/app/tenants/hooks'
import type { RegisterRequest } from '@/app/auth/types'
import type { SubscriptionStatus } from '@/app/tenants/types'

const EMPTY_FORM: RegisterRequest = {
  tenantName: '',
  tenantSlug: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Error al crear la organización. Intenta nuevamente.'
}

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: 'Prueba',
  active: 'Activo',
  past_due: 'Vencido',
  cancelled: 'Cancelado',
}

const STATUS_VARIANT: Record<SubscriptionStatus, 'default' | 'emerald' | 'orange' | 'destructive'> = {
  trial: 'default',
  active: 'emerald',
  past_due: 'orange',
  cancelled: 'destructive',
}

function TenantsPage() {
  const errorId = useId()
  const [showPassword, setShowPassword] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<RegisterRequest>(EMPTY_FORM)
  const [created, setCreated] = useState<string | null>(null)

  const { mutate: register, isPending, error, reset } = useRegister()
  const { data: tenantsData, isLoading: loadingTenants } = useTenants()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => {
      if (name === 'tenantName') {
        return { ...prev, tenantName: value, tenantSlug: slugify(value) }
      }
      return { ...prev, [name]: value }
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    register(form, {
      onSuccess: () => {
        setCreated(form.tenantName)
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

  const errorMessage = error ? extractMessage(error) : null
  const tenants = tenantsData?.data ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Organizaciones</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona los tenants de la plataforma.
          </Text>
        </div>
        <Button onClick={() => setShowForm(v => !v)} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva organización
          {showForm ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-canvas rounded-2xl border border-hairline shadow-raised p-8">
          <div className="mb-6 pb-5 border-b border-hairline">
            <Text as="md" className="font-semibold text-foreground">Nueva organización</Text>
            <Text as="sm" className="text-muted-foreground mt-1">
              Registra el tenant y asigna las credenciales del primer administrador.
            </Text>
          </div>

          {created ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="size-14 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <div className="space-y-1.5">
                <Heading as="md">¡Organización creada con éxito!</Heading>
                <Text as="sm" className="text-muted-foreground">
                  El tenant <span className="font-semibold text-foreground">{created}</span> ya está listo para operar.
                </Text>
              </div>
              <Button className="mt-4" onClick={handleNew}>
                Crear otra organización
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              {errorMessage && (
                <div
                  id={errorId}
                  role="alert"
                  className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-4 py-3 text-sm flex items-start gap-2"
                >
                  {errorMessage}
                </div>
              )}

              <div className="space-y-5 bg-surface-soft/40 p-4 sm:p-6 rounded-xl border border-hairline/60">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</div>
                  <Text as="caption" className="font-semibold text-foreground uppercase tracking-wide">
                    Datos de la organización
                  </Text>
                </div>
                <div className="space-y-4 pl-0 sm:pl-8">
                  <div className="space-y-1.5">
                    <Label htmlFor="tenantName">Nombre de la inmobiliaria</Label>
                    <Input id="tenantName" name="tenantName" placeholder="Ej. Inmobiliaria Norte"
                      value={form.tenantName} onChange={handleChange} required className="shadow-none bg-canvas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tenantSlug">
                      Identificador único
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(auto-generado)</span>
                    </Label>
                    <Input id="tenantSlug" name="tenantSlug" placeholder="inmobiliaria-norte"
                      value={form.tenantSlug} onChange={handleChange} required
                      className="shadow-none font-mono text-sm bg-canvas" />
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-surface-soft/40 p-4 sm:p-6 rounded-xl border border-hairline/60">
                <div className="flex items-center gap-2 mb-1">
                  <div className="size-6 rounded bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</div>
                  <Text as="caption" className="font-semibold text-foreground uppercase tracking-wide">
                    Administrador principal
                  </Text>
                </div>
                <div className="space-y-4 pl-0 sm:pl-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input id="firstName" name="firstName" placeholder="Juan"
                        value={form.firstName} onChange={handleChange} required autoComplete="off" className="shadow-none bg-canvas" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input id="lastName" name="lastName" placeholder="Pérez"
                        value={form.lastName} onChange={handleChange} required autoComplete="off" className="shadow-none bg-canvas" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input id="email" name="email" type="email" placeholder="admin@correo.com"
                      value={form.email} onChange={handleChange} required autoComplete="off" className="shadow-none bg-canvas" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Contraseña temporal</Label>
                    <div className="relative">
                      <Input id="password" name="password" type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" value={form.password} onChange={handleChange}
                        required autoComplete="new-password" className="pr-9 shadow-none bg-canvas" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="px-8">
                  {isPending && <Loader2 className="animate-spin mr-2" />}
                  Crear organización
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tenants list */}
      <div className="bg-canvas rounded-2xl border border-hairline shadow-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-hairline">
          <Text as="md" className="font-semibold">
            Tenants registrados
            {tenantsData && (
              <span className="ml-2 text-muted-foreground font-normal text-sm">({tenantsData.meta?.itemCount ?? tenants.length})</span>
            )}
          </Text>
        </div>

        {loadingTenants ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Text as="sm" className="text-muted-foreground">No hay organizaciones registradas aún.</Text>
            <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-1" /> Crear primera organización
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline bg-surface-soft/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Slug</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Creado</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, i) => (
                  <tr key={tenant.id} className={i !== tenants.length - 1 ? 'border-b border-hairline' : ''}>
                    <td className="px-6 py-4 font-medium">{tenant.name}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground text-xs">{tenant.slug}</td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[tenant.subscription_status]}>
                        {STATUS_LABEL[tenant.subscription_status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString('es-CR')}
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

export default TenantsPage
