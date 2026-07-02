import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Clock, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { useResetPassword, useValidateResetToken } from '@/app/auth/hooks'

interface PasswordRule {
  label: string
  test: (v: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Mínimo 8 caracteres',     test: v => v.length >= 8 },
  { label: 'Una letra mayúscula',      test: v => /[A-Z]/.test(v) },
  { label: 'Un número',                test: v => /[0-9]/.test(v) },
  { label: 'Un símbolo (!@#$%...)',    test: v => /[^A-Za-z0-9]/.test(v) },
]

interface Props {
  token: string | undefined
}

function ResetPasswordPage({ token }: Props) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState(false)
  const [success, setSuccess] = useState(false)

  const { isLoading: validating, isError: tokenInvalid, error: tokenError } = useValidateResetToken(token)
  const { mutate: resetPassword, isPending, error } = useResetPassword()

  const allRulesMet = PASSWORD_RULES.every(r => r.test(password))
  const passwordsMatch = password === confirm

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setTouched(true)
    if (!token || !allRulesMet || !passwordsMatch) return

    resetPassword(
      { token, password },
      {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => void navigate({ to: '/login' }), 3000)
        },
      },
    )
  }

  const errorMessage = error ? extractMessage(error) : null

  // Missing token
  if (!token) {
    return <TokenErrorLayout message="Enlace inválido o incompleto." />
  }

  // Validating token on mount
  if (validating) {
    return (
      <AuthShell title="Verificando enlace" subtitle="Comprobando que tu enlace sea válido…">
        <div className="flex justify-center py-4">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      </AuthShell>
    )
  }

  // Token expired / used / invalid (detected on load)
  if (tokenInvalid) {
    const msg = extractMessage(tokenError)
    const isExpired = msg.includes('expiró')
    return (
      <AuthShell
        title={isExpired ? 'Enlace expirado' : 'Enlace ya utilizado'}
        subtitle={isExpired
          ? 'Este enlace de restablecimiento ya no es válido.'
          : 'Este enlace ya fue usado para cambiar una contraseña.'}
      >
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
              {isExpired
                ? <Clock className="size-8 text-destructive" />
                : <XCircle className="size-8 text-destructive" />}
            </div>
          </div>
          <Text as="sm" className="text-muted-foreground text-center">
            {isExpired
              ? 'Los enlaces de restablecimiento son válidos por 15 minutos. Solicita uno nuevo para continuar.'
              : 'Por seguridad, cada enlace solo puede usarse una vez. Solicita uno nuevo si necesitas cambiar tu contraseña.'}
          </Text>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  // Success state
  if (success) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Tu contraseña fue cambiada exitosamente">
        <div className="text-center space-y-4 py-2">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-7 text-primary" />
          </div>
          <Text as="sm" className="text-muted-foreground">
            Redirigiendo al inicio de sesión…
          </Text>
          <Link
            to="/login"
            className="block text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            Ir ahora →
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-3">

        <div className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-hairline">
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-primary-foreground font-bold text-xl leading-none">P</span>
            </div>
            <Heading as="md">Nueva contraseña</Heading>
            <Text as="sm" className="text-muted-foreground mt-1">
              Elige una contraseña segura para tu cuenta
            </Text>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg bg-destructive/8 border border-destructive/20 text-destructive px-3.5 py-2.5 text-sm"
                >
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => setTouched(true)}
                    autoComplete="new-password"
                    autoFocus
                    disabled={isPending}
                    className="pr-9 shadow-none"
                    aria-describedby="password-rules"
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onBlur={() => setTouched(true)}
                  autoComplete="new-password"
                  disabled={isPending}
                  className={`shadow-none ${touched && confirm && !passwordsMatch ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {touched && confirm && !passwordsMatch && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                )}
              </div>

              {/* Password strength rules */}
              <div id="password-rules" className="rounded-lg bg-surface-soft border border-hairline px-4 py-3 space-y-1.5">
                {PASSWORD_RULES.map(rule => {
                  const ok = rule.test(password)
                  const showError = touched && !ok
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {ok ? (
                        <CheckCircle2 className="size-3.5 text-success shrink-0" />
                      ) : showError ? (
                        <XCircle className="size-3.5 text-destructive shrink-0" />
                      ) : (
                        <div className="size-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                      )}
                      <Text
                        as="caption"
                        className={
                          ok
                            ? 'text-success'
                            : showError
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {rule.label}
                      </Text>
                    </div>
                  )
                })}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || (touched && !allRulesMet)}
              >
                {isPending && <Loader2 className="animate-spin" />}
                Cambiar contraseña
              </Button>
            </form>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ArrowLeft className="size-3.5" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

function TokenErrorLayout({ message }: { message: string }) {
  return (
    <AuthShell title="Enlace inválido" subtitle={message}>
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-8 text-destructive" />
          </div>
        </div>
        <Button asChild className="w-full">
          <Link to="/forgot-password">Solicitar nuevo enlace</Link>
        </Button>
      </div>
    </AuthShell>
  )
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-soft flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm space-y-3">
        <div className="bg-canvas rounded-2xl border border-hairline shadow-sm overflow-hidden">
          <div className="px-8 pt-8 pb-6 text-center border-b border-hairline">
            <div className="size-11 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-primary-foreground font-bold text-xl leading-none">P</span>
            </div>
            <Heading as="md">{title}</Heading>
            <Text as="sm" className="text-muted-foreground mt-1">{subtitle}</Text>
          </div>
          <div className="px-8 py-6">{children}</div>
        </div>
        <div className="flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ArrowLeft className="size-3.5" />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

function extractMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown }
    if (typeof e.message === 'string') return e.message
    if (Array.isArray(e.message) && typeof e.message[0] === 'string') return e.message[0]
  }
  return 'Error al cambiar la contraseña. Intenta nuevamente.'
}

export default ResetPasswordPage
