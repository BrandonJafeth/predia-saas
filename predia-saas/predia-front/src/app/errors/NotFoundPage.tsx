import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

function NotFoundPage() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-background px-6 pt-16 gap-6 overflow-hidden">
      <img
        src="/404.png"
        alt="Página no encontrada"
        className="w-full max-w-sm object-contain"
        draggable={false}
      />
      <div className="text-center space-y-1">
        <p className="text-sm text-ink-muted">La página que buscas no existe o fue movida.</p>
      </div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-body transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al inicio
      </Link>
    </div>
  )
}

export default NotFoundPage
