import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/shared/lib/utils'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(date: Date | undefined) {
    onChange(date)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-40 items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 text-sm',
            'text-left transition-colors hover:bg-surface-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            !value && 'text-ink-muted',
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-ink-muted" />
          <span className="flex-1 truncate">
            {value ? formatDisplay(value) : placeholder}
          </span>
          {value && (
            <X
              className="size-3.5 shrink-0 text-ink-muted hover:text-ink transition-colors"
              onClick={handleClear}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
