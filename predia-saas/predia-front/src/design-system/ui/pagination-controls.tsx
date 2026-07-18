import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface Props {
  page: number
  pageCount: number
  itemCount: number
  limit: number
  onPageChange: (page: number) => void
}

function buildPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | 'ellipsis')[] = [1]

  if (current > 3) pages.push('ellipsis')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)

  if (current < total - 2) pages.push('ellipsis')

  pages.push(total)
  return pages
}

function PageBtn({
  page, active, disabled, onClick,
}: {
  page: number | 'ellipsis'
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  if (page === 'ellipsis') {
    return (
      <span className="flex h-9 w-9 items-center justify-center text-ink-muted">
        <MoreHorizontal className="size-4" />
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all duration-150 select-none',
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'bg-surface-card text-ink-body hover:bg-surface-strong disabled:opacity-40 disabled:cursor-not-allowed',
      )}
    >
      {page}
    </button>
  )
}

function NavBtn({
  direction, disabled, onClick,
}: {
  direction: 'prev' | 'next'
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Página anterior' : 'Página siguiente'}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-ink-body transition-all duration-150 hover:bg-surface-strong disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {direction === 'prev'
        ? <ChevronLeft className="size-4" />
        : <ChevronRight className="size-4" />}
    </button>
  )
}

export function PaginationControls({ page, pageCount, itemCount, onPageChange }: Props) {
  if (itemCount === 0) return null

  const pages = buildPages(page, pageCount)

  return (
    <div className="flex items-center justify-end px-1 py-2">
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <NavBtn direction="prev" disabled={page <= 1} onClick={() => onPageChange(page - 1)} />

          {pages.map((p, i) => (
            <PageBtn
              key={p === 'ellipsis' ? `ellipsis-${i}` : p}
              page={p}
              active={p === page}
              disabled={p === page}
              onClick={p !== 'ellipsis' ? () => onPageChange(p as number) : undefined}
            />
          ))}

          <NavBtn direction="next" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} />
        </div>
      )}
    </div>
  )
}
