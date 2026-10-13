import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { Switch } from '@/design-system/ui/switch'
import { useLookupTenants, useLogin } from '@/app/auth/hooks'
import type { TenantOption } from '@/app/auth/types'

// Maps server/network errors to plain, user-friendly Spanish
function toFriendlyMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return 'Ocurrió un problema. Por favor intenta de nuevo.'
  }
  const raw = error as { message: unknown }
  const text = typeof raw.message === 'string'
    ? raw.message
    : Array.isArray(raw.message) && typeof raw.message[0] === 'string'
      ? raw.message[0]
      : ''

  const lower = text.toLowerCase()

  if (lower.includes('invalid') || lower.includes('credentials') || lower.includes('unauthorized') || lower.includes('password') || lower.includes('incorrect'))
    return 'La contraseña que ingresaste no es correcta. Por favor verifica e intenta de nuevo.'
  if (lower.includes('not found') || lower.includes('no user') || lower.includes('no account'))
    return 'No encontramos una cuenta con ese correo electrónico.'
  if (lower.includes('suspended') || lower.includes('inactive') || lower.includes('disabled'))
    return 'Tu cuenta está desactivada. Contacta a tu administrador para reactivarla.'
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('connect') || lower.includes('timeout'))
    return 'No pudimos conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.'
  if (lower.includes('too many') || lower.includes('rate limit') || lower.includes('blocked'))
    return 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.'

  return 'Ocurrió un problema al iniciar sesión. Por favor intenta de nuevo.'
}

function AlertBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-error/20 bg-error/5 px-3.5 py-3 text-sm flex items-start gap-3"
    >
      <svg
        className="size-4 shrink-0 mt-0.5 text-error/70"
        fill="none"
        viewBox="0 0 16 16"
        aria-hidden
      >
        <path
          d="M8 5v4M8 11h.01M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-ink-body leading-relaxed">{message}</span>
    </div>
  )
}

function OrgInitial({ name }: { name: string }) {
  return (
    <div className="size-9 rounded-md bg-surface-card border border-hairline flex items-center justify-center shrink-0">
      <span className="text-ink-body font-medium text-sm leading-none">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

// Paso 1: email + contraseña. /auth/lookup ya no revela en qué organizaciones
// existe un correo: solo devuelve las organizaciones donde las credenciales son
// válidas. Con una sola, se entra directo; con varias, se elige en el paso 2.
type Step = 'credentials' | 'organization' | 'success'

function LoginPage() {
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [selectedTenant, setSelectedTenant] = useState<TenantOption | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [invalidCredentials, setInvalidCredentials] = useState(false)
  const [exiting, setExiting] = useState(false)

  const { mutate: lookup, isPending: isLooking, error: lookupError, reset: resetLookup } = useLookupTenants()
  const { mutate: login, isPending: isLoggingIn, error: loginError, reset: resetLogin } = useLogin()

  // Trigger navigation after welcome screen
  useEffect(() => {
    if (step !== 'success') return
    const exitTimer = setTimeout(() => setExiting(true), 1600)
    const navTimer = setTimeout(() => void navigate({ to: '/dashboard' }), 2000)
    return () => { clearTimeout(exitTimer); clearTimeout(navTimer) }
  }, [step, navigate])

  function loginInto(tenant: TenantOption) {
    setSelectedTenant(tenant)
    login({ email, password, tenantId: tenant.id }, {
      onSuccess: () => setStep('success'),
    })
  }

  function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInvalidCredentials(false)
    resetLogin()
    lookup({ email, password }, {
      onSuccess: (data) => {
        if (data.length === 0) {
          setInvalidCredentials(true)
          return
        }
        setTenants(data)
        if (data.length === 1) {
          loginInto(data[0])
        } else {
          setSelectedTenant(null)
          setStep('organization')
        }
      },
    })
  }

  function goBack() {
    setStep('credentials')
    setTenants([])
    setSelectedTenant(null)
    setPassword('')
    setInvalidCredentials(false)
    resetLookup()
    resetLogin()
  }

  const isBusy = isLooking || isLoggingIn
  const credentialsErrorMsg = invalidCredentials
    ? 'El correo o la contraseña no son correctos. Por favor verifica e intenta de nuevo.'
    : lookupError
      ? toFriendlyMessage(lookupError)
      : step === 'credentials' && loginError
        ? toFriendlyMessage(loginError)
        : null
  const loginErrorMsg = step === 'organization' && loginError ? toFriendlyMessage(loginError) : null

  // ── Welcome / success screen ──────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div
        className={[
          'min-h-screen bg-background flex flex-col items-center justify-center gap-6',
          exiting ? 'animate-welcome-out' : 'animate-welcome-in',
        ].join(' ')}
      >
        <img src="/isotipoClaro.png" alt="Predia" className="h-16 w-16 object-contain" />
        <div className="text-center space-y-1">
          <p className="text-base font-medium text-ink">
            {selectedTenant ? `Bienvenido a ${selectedTenant.name}` : 'Bienvenido a Predia'}
          </p>
          <p className="text-sm text-ink-muted">Preparando tu espacio...</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-ink-muted/40 animate-dot-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Login card ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-3">

        <div className="bg-canvas rounded-xl border border-hairline shadow-raised overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-hairline">
            <img src="/isotipoClaro.png" alt="Predia" className="h-12 w-12 object-contain mx-auto mb-5" />

            {step === 'credentials' ? (
              <>
                <h3 className="text-[18px] font-medium leading-snug tracking-tight text-ink">
                  Iniciar sesión
                </h3>
                <p className="text-sm text-ink-muted mt-1.5">
                  Ingresa tu correo y contraseña para continuar
                </p>
              </>
            ) : (
              <>
                <h3 className="text-[18px] font-medium leading-snug tracking-tight text-ink">
                  Selecciona tu organización
                </h3>
                <div className="mt-2.5 inline-flex items-center px-3 py-1 rounded-full bg-surface-card border border-hairline">
                  <span className="text-caption text-ink-muted">{email}</span>
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <div className="px-8 py-8">

            {/* Step 1 — Email + password */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-6">
                {credentialsErrorMsg && <AlertBanner message={credentialsErrorMsg} />}

                <div className="flex flex-col">
                  <Label htmlFor="email" className="text-sm font-medium text-ink-body mb-3">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      setInvalidCredentials(false)
                    }}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  <p className="mt-1.5 text-[13px] text-ink-muted">
                    Ejemplo: tu@correo.com.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium text-ink-body">
                      Contraseña
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-ink-muted hover:text-ink transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value)
                        setInvalidCredentials(false)
                        resetLogin()
                      }}
                      required
                      autoComplete="current-password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    className="scale-[0.85] origin-left"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-caption text-ink-muted font-normal cursor-pointer select-none"
                  >
                    Recordarme
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isBusy || !email.trim() || !password}>
                  {isBusy && <Loader2 className="animate-spin" />}
                  {isBusy ? 'Verificando...' : 'Entrar'}
                </Button>
              </form>
            )}

            {/* Step 2 — Org (solo si la cuenta existe en varias) */}
            {step === 'organization' && (
              <div className="space-y-5">
                {loginErrorMsg && <AlertBanner message={loginErrorMsg} />}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-ink-body">Organización</Label>
                  <div className="flex flex-col gap-2">
                    {tenants.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isLoggingIn}
                        onClick={() => { resetLogin(); loginInto(t) }}
                        className={[
                          'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-60',
                          selectedTenant?.id === t.id
                            ? 'border-ink bg-surface-card ring-1 ring-ink/10'
                            : 'border-hairline bg-canvas hover:border-surface-strong hover:bg-surface-soft',
                        ].join(' ')}
                      >
                        <OrgInitial name={t.name} />
                        <p className="font-medium text-sm text-ink truncate">{t.name}</p>
                        {selectedTenant?.id === t.id && isLoggingIn && (
                          <Loader2 className="ml-auto size-4 animate-spin text-ink-muted" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {step === 'organization' && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors py-1"
            >
              <ArrowLeft className="size-3.5" />
              Usar otro correo
            </button>
          </div>
        )}

        <p className="text-center text-[12px] text-ink-soft">
          © {new Date().getFullYear()} Predia. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
