import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Label } from '@/design-system/ui/label'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: implement password reset endpoint
    setSubmitted(true)
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
            <Heading as="md">Recuperar contraseña</Heading>
            <Text as="sm" className="text-muted-foreground mt-1">
              Te enviaremos un enlace para restablecer tu contraseña
            </Text>
          </div>

          {/* Form */}
          <div className="px-8 py-6">
            {submitted ? (
              <div className="text-center space-y-4 py-2">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Mail className="size-7 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-semibold text-sm text-foreground">Revisa tu correo</p>
                  <Text as="sm" className="text-muted-foreground">
                    Si <span className="font-medium text-foreground">{email}</span> está registrado,
                    recibirás las instrucciones en los próximos minutos.
                  </Text>
                </div>
                <Text as="caption" className="text-muted-foreground">
                  Esta función estará disponible próximamente.
                </Text>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!email.trim()}>
                  Enviar enlace
                </Button>

                <div className="rounded-lg bg-surface-soft border border-hairline px-4 py-3">
                  <Text as="caption" className="text-muted-foreground text-center">
                    Esta función estará disponible próximamente.
                  </Text>
                </div>
              </form>
            )}
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

export default ForgotPasswordPage
