import { useId, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useLogin } from '@/app/auth/hooks'
import type { LoginRequest } from '@/app/auth/types'

function AlertIcon() {
  return (
    <svg className="size-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M8 5v4M8 11h.01M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Credenciales inválidas. Intenta nuevamente.'
}

function LoginPage() {
  const navigate = useNavigate()
  const errorId = useId()
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState<LoginRequest>({
    email: '',
    password: '',
    tenantSlug: '',
  })

  const { mutate: login, isPending, error } = useLogin()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    login(form, {
      onSuccess: () => void navigate({ to: '/dashboard' }),
    })
  }

  const errorMessage = error ? extractMessage(error) : null

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="bg-canvas rounded-2xl border border-hairline shadow-sm p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="size-10 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-sm">
              <span className="text-primary-foreground font-bold text-lg leading-none">P</span>
            </div>
            <div className="space-y-1.5">
              <Heading as="lg">Iniciar sesión</Heading>
              <Text as="sm" className="text-muted-foreground">
                Ingresa a tu cuenta para continuar
              </Text>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {errorMessage && (
              <div
                id={errorId}
                role="alert"
                className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-3.5 py-2.5 text-sm flex items-start gap-2"
              >
                <AlertIcon />
                {errorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tenantSlug">Organización</Label>
              <Input
                id="tenantSlug"
                name="tenantSlug"
                placeholder="inmobiliaria-norte"
                value={form.tenantSlug}
                onChange={handleChange}
                required
                autoComplete="organization"
                aria-describedby={errorMessage ? errorId : undefined}
                className="shadow-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                aria-describedby={errorMessage ? errorId : undefined}
                className="shadow-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="pr-9 shadow-none"
                  aria-describedby={errorMessage ? errorId : undefined}
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

            <Button type="submit" className="w-full mt-2" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default LoginPage
