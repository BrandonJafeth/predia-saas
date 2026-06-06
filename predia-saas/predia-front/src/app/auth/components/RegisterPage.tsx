import { useId, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { Separator } from '@/design-system/ui/separator'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useRegister } from '@/app/auth/hooks'
import type { RegisterRequest } from '@/app/auth/types'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function RegisterPage() {
  const navigate = useNavigate()
  const errorId = useId()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<RegisterRequest>({
    tenantName: '',
    tenantSlug: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const { mutate: register, isPending, error } = useRegister()

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
      onSuccess: () => void navigate({ to: '/dashboard' }),
    })
  }

  const errorMessage = error ? extractMessage(error) : null

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-canvas rounded-2xl border border-hairline shadow-sm p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-sm">
              <span className="text-primary-foreground font-bold text-lg leading-none">P</span>
            </div>
            <div className="space-y-1.5">
              <Heading as="lg">Crear organización</Heading>
              <Text as="sm" className="text-muted-foreground">
                Registra tu inmobiliaria y comienza a gestionar propiedades
              </Text>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {errorMessage && (
              <div
                id={errorId}
                role="alert"
                className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-3.5 py-2.5 text-sm flex items-start gap-2"
              >
                {errorMessage}
              </div>
            )}

            {/* Tenant section */}
            <div className="space-y-4">
              <Text as="caption" className="font-medium text-muted-foreground uppercase tracking-wide">
                Datos de la organización
              </Text>

              <div className="space-y-1.5">
                <Label htmlFor="tenantName">Nombre de la inmobiliaria</Label>
                <Input
                  id="tenantName"
                  name="tenantName"
                  placeholder="Inmobiliaria Norte"
                  value={form.tenantName}
                  onChange={handleChange}
                  required
                  aria-describedby={errorMessage ? errorId : undefined}
                  className="shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tenantSlug">
                  Identificador
                  <span className="ml-1.5 text-xs text-muted-foreground font-normal">(auto-generado)</span>
                </Label>
                <Input
                  id="tenantSlug"
                  name="tenantSlug"
                  placeholder="inmobiliaria-norte"
                  value={form.tenantSlug}
                  onChange={handleChange}
                  required
                  aria-describedby={errorMessage ? errorId : undefined}
                  className="shadow-none"
                />
                <Text as="caption" className="text-muted-foreground">
                  Solo minúsculas, números y guiones
                </Text>
              </div>
            </div>

            <Separator />

            {/* Admin user section */}
            <div className="space-y-4">
              <Text as="caption" className="font-medium text-muted-foreground uppercase tracking-wide">
                Datos del administrador
              </Text>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Juan"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    className="shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Pérez"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    className="shadow-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@correo.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    className="pr-9 shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Crear organización
            </Button>
          </form>
        </div>

        <Text as="sm" className="mt-6 text-center text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Iniciar sesión
          </Link>
        </Text>
      </div>
    </div>
  )
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Error al crear la cuenta. Intenta nuevamente.'
}

export default RegisterPage
