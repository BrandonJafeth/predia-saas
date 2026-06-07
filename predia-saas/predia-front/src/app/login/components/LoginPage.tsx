import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, LayoutDashboard, Loader2, MapPin, Users } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useLookupTenants, useLogin } from '@/app/auth/hooks'
import type { TenantOption } from '@/app/auth/types'

function AlertBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-3.5 py-2.5 text-sm flex items-start gap-2">
      <svg className="size-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
        <path d="M8 5v4M8 11h.01M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  )
}

function OrgInitial({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase()
  return (
    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <span className="text-primary font-semibold text-sm leading-none">{letter}</span>
    </div>
  )
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message: unknown }
    if (typeof message === 'string') return message
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  }
  return 'Ocurrió un error. Intenta nuevamente.'
}

type Step = 'email' | 'password'

function LoginPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantOption | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { mutate: lookup, isPending: isLooking, error: lookupError, reset: resetLookup } = useLookupTenants()
  const { mutate: login, isPending: isLoggingIn, error: loginError } = useLogin()

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setHasSearched(true)
    lookup({ email }, {
      onSuccess: (data) => {
        if (data.length === 0) return
        setTenants(data)
        setSelectedTenant(data.length === 1 ? data[0] : null)
        setStep('password')
      },
    })
  }

  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedTenant) return
    login({ email, password, tenantId: selectedTenant.id }, {
      onSuccess: () => void navigate({ to: '/dashboard' }),
    })
  }

  function goBack() {
    setStep('email')
    setTenants([])
    setSelectedTenant(null)
    setPassword('')
    setHasSearched(false)
    resetLookup()
  }

  const noTenantsFound = hasSearched && !isLooking && !lookupError && tenants.length === 0
  const lookupErrorMsg = lookupError ? extractMessage(lookupError) : null
  const loginErrorMsg = loginError ? extractMessage(loginError) : null

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-3">

        {/* Card */}
        <div className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden">

          {/* Header band */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-hairline">
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-primary-foreground font-bold text-xl leading-none">P</span>
            </div>

            {step === 'email' ? (
              <>
                <Heading as="md">Iniciar sesión</Heading>
                <Text as="sm" className="text-muted-foreground mt-1">
                  Ingresa tu correo para continuar
                </Text>
              </>
            ) : (
              <>
                <Heading as="md">Selecciona tu organización</Heading>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-soft border border-hairline">
                  <span className="text-[13px] text-muted-foreground">{email}</span>
                </div>
              </>
            )}
          </div>

          {/* Form area */}
          <div className="px-8 py-6">

            {/* ── Step 1: Email ── */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
                {lookupErrorMsg && <AlertBanner message={lookupErrorMsg} />}

                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      if (hasSearched) setHasSearched(false)
                    }}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {noTenantsFound && (
                  <div className="rounded-lg bg-surface-soft border border-hairline px-4 py-3 text-center">
                    <Text as="sm" className="text-muted-foreground">
                      No encontramos organizaciones asociadas a este correo.
                    </Text>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLooking || !email.trim()}>
                  {isLooking ? <Loader2 className="animate-spin" /> : null}
                  {isLooking ? 'Buscando...' : 'Continuar'}
                </Button>

                {/* Features */}
                <div className="pt-2 border-t border-hairline space-y-2.5">
                  {[
                    { icon: MapPin, label: 'Gestión de propiedades y listados' },
                    { icon: Users, label: 'CRM de clientes y seguimiento de leads' },
                    { icon: LayoutDashboard, label: 'Reportes y métricas en tiempo real' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="size-3 text-primary" />
                      </div>
                      <Text as="caption" className="text-muted-foreground">{label}</Text>
                    </div>
                  ))}
                </div>
              </form>
            )}

            {/* ── Step 2: Select org + password ── */}
            {step === 'password' && (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-5">
                {loginErrorMsg && <AlertBanner message={loginErrorMsg} />}

                {/* Org selection */}
                {tenants.length > 1 ? (
                  <div className="space-y-2">
                    <Label>Organización</Label>
                    <div className="flex flex-col gap-2">
                      {tenants.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTenant(t)}
                          className={[
                            'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                            selectedTenant?.id === t.id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-hairline bg-canvas hover:border-muted-foreground/30 hover:bg-surface-soft/50',
                          ].join(' ')}
                        >
                          <OrgInitial name={t.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">{t.name}</p>
                          </div>
                          {selectedTenant?.id === t.id && (
                            <div className="ml-auto size-4 rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0">
                              <div className="size-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-soft/60 px-4 py-3">
                    <OrgInitial name={tenants[0]?.name ?? ''} />
                    <div className="min-w-0">
                      <Text as="caption" className="text-muted-foreground">Organización</Text>
                      <p className="font-semibold text-sm text-foreground truncate">{tenants[0]?.name}</p>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      autoFocus
                      className="pr-9"
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn || !selectedTenant || !password}
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" /> : null}
                  {isLoggingIn ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Back link — outside card */}
        {step === 'password' && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ArrowLeft className="size-3.5" />
              Usar otro correo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage
