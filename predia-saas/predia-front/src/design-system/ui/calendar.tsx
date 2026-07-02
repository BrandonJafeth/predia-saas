'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label: 'text-sm font-medium',
        nav: 'flex items-center justify-between absolute inset-x-1 top-1',
        button_previous: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted',
          'hover:bg-surface-strong hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        ),
        button_next: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full border border-hairline bg-canvas text-ink-muted',
          'hover:bg-surface-strong hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-ink-muted rounded-md w-9 font-normal text-[0.8rem] flex items-center justify-center',
        week: 'flex w-full mt-1',
        day: cn(
          'relative p-0 text-center text-sm',
          '[&:has([data-selected])]:bg-primary/10 first:[&:has([data-selected])]:rounded-l-full last:[&:has([data-selected])]:rounded-r-full',
          '[&:has([data-selected].day-outside)]:bg-primary/5',
          '[&:has([data-selected][data-range-end])]:rounded-r-full',
          'focus-within:relative focus-within:z-20',
        ),
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all',
          'hover:bg-surface-strong hover:text-ink',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        ),
        selected: 'day-selected [&>button]:bg-primary [&>button]:text-on-primary [&>button]:hover:bg-primary [&>button]:hover:text-on-primary',
        today: '[&>button]:bg-surface-strong [&>button]:text-ink [&>button]:font-semibold',
        outside: 'day-outside text-ink-soft opacity-50',
        disabled: 'text-ink-soft opacity-40 cursor-not-allowed',
        range_middle: '[&>button]:bg-primary/10 [&>button]:text-ink',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeft className="size-4" {...chevronProps} />
          ) : (
            <ChevronRight className="size-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }
export type { CalendarProps }
