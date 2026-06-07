import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'

interface Props {
  page: number
  pageCount: number
  itemCount: number
  limit: number
  onPageChange: (page: number) => void
}

export function PaginationControls({ page, pageCount, itemCount, limit, onPageChange }: Props) {
  if (pageCount <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, itemCount)

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-hairline">
      <span className="text-sm text-muted-foreground">
        Mostrando {from}–{to} de {itemCount}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 p-0"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="px-3 text-sm text-muted-foreground tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="h-8 w-8 p-0"
          aria-label="Página siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
