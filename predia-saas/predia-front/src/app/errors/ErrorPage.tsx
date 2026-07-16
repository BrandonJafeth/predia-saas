import { ArrowLeft, RotateCw } from 'lucide-react'
import { Button } from '@/design-system/ui/button'

interface ErrorPageProps {
  error: unknown
  reset: () => void
}

function ErrorPage({ error, reset }: ErrorPageProps) {
  const message = error instanceof Error ? error.message : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink">Ocurrió un error inesperado.</p>
        <p className="text-sm text-ink-muted">Intenta de nuevo o vuelve al inicio.</p>
      </div>
      {import.meta.env.DEV && message && (
        <pre className="max-w-lg overflow-auto rounded border border-hairline bg-canvas p-3 text-left text-xs text-ink-muted">
          {message}
        </pre>
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCw className="size-4" />
          Reintentar
        </Button>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-body transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver al inicio
        </a>
      </div>
    </div>
  )
}

export default ErrorPage
