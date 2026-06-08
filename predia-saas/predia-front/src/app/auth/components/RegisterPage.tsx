import { useId, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import { Separator } from '@/design-system/ui/separator'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import { FormField } from '@/shared/components/form-field'
import { useRegister } from '@/app/auth/hooks'
import { registerSchema, type RegisterFormValues } from '@/app/auth/types/register.schema'
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

  const { mutate: register, isPending, error } = useRegister()

  const form = useForm({
    defaultValues: {
      tenantName: '',
      tenantSlug: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    } satisfies RegisterFormValues,
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: ({ value }: { value: RegisterFormValues }) => {
      register(value as RegisterRequest, {
        onSuccess: () => void navigate({ to: '/dashboard' }),
      })
    },
  })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
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

          <form onSubmit={handleFormSubmit} noValidate className="space-y-6">
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

              <form.Field name="tenantName">
                {(field) => (
                  <FormField field={field} label="Nombre de la inmobiliaria">
                    <Input
                      id="tenantName"
                      placeholder="Inmobiliaria Norte"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        form.setFieldValue('tenantSlug', slugify(e.target.value))
                      }}
                      onBlur={field.handleBlur}
                      className="shadow-none"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="tenantSlug">
                {(field) => {
                  const errors = field.state.meta.isTouched ? field.state.meta.errors : []
                  const errorMsg = errors.length > 0
                    ? (typeof errors[0] === 'string'
                        ? errors[0]
                        : (errors[0] as { message?: string } | undefined)?.message)
                    : undefined
                  return (
                    <div className="space-y-1.5">
                      <Label htmlFor="tenantSlug">
                        Identificador
                        <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                          (auto-generado)
                        </span>
                      </Label>
                      <Input
                        id="tenantSlug"
                        placeholder="inmobiliaria-norte"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="shadow-none"
                        aria-invalid={!!errorMsg}
                        aria-describedby={errorMsg ? 'tenantSlug-error' : undefined}
                      />
                      {errorMsg ? (
                        <p id="tenantSlug-error" role="alert" className="text-[13px] font-body font-medium leading-[1.4] text-destructive">
                          {errorMsg}
                        </p>
                      ) : (
                        <Text as="caption" className="text-muted-foreground">
                          Solo minúsculas, números y guiones
                        </Text>
                      )}
                    </div>
                  )
                }}
              </form.Field>
            </div>

            <Separator />

            {/* Admin user section */}
            <div className="space-y-4">
              <Text as="caption" className="font-medium text-muted-foreground uppercase tracking-wide">
                Datos del administrador
              </Text>

              <div className="grid grid-cols-2 gap-3">
                <form.Field name="firstName">
                  {(field) => (
                    <FormField field={field} label="Nombre">
                      <Input
                        id="firstName"
                        placeholder="Juan"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="given-name"
                        className="shadow-none"
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <FormField field={field} label="Apellido">
                      <Input
                        id="lastName"
                        placeholder="Pérez"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="family-name"
                        className="shadow-none"
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>

              <form.Field name="email">
                {(field) => (
                  <FormField field={field} label="Correo electrónico">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@correo.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      autoComplete="email"
                      className="shadow-none"
                    />
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
                        placeholder="••••••••"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        autoComplete="new-password"
                        className="pr-9 shadow-none"
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
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={form.state.isSubmitting || isPending}
            >
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
