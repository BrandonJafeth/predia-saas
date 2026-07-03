import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { cn } from '@/shared/lib/utils'
import type { Matcher } from 'react-day-picker'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  /** Dates before this are disabled */
  minDate?: Date
  /** Dates after this are disabled */
  maxDate?: Date
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha', className, minDate, maxDate }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(date: Date | undefined) {
    onChange(date)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(undefined)
  }

  // Build disabled matchers from minDate / maxDate
  const disabled: Matcher[] = []
  if (minDate) disabled.push({ before: minDate })
  if (maxDate) disabled.push({ after: maxDate })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-auto min-w-40 items-center justify-between gap-2 rounded-lg border border-hairline bg-canvas px-3 text-sm',
            'text-left transition-colors hover:bg-surface-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            !value && 'text-ink-muted',
            className,
          )}
        >
          <span className="flex-1 truncate">
            {value ? formatDisplay(value) : placeholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {value && (
              <X
                className="size-3.5 text-ink-muted hover:text-ink transition-colors"
                onClick={handleClear}
              />
            )}
            <CalendarIcon className="size-4 text-ink-muted/50" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabled.length > 0 ? disabled : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

