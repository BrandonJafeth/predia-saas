import * as React from 'react'
import { cn } from '@/shared/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-surface-dark/40 focus-visible:ring-2 focus-visible:ring-surface-dark/8 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
