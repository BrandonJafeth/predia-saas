import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-body font-normal transition-colors focus-ring',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-ink-soft/15 text-ink-body',
        orange:
          'border-transparent bg-badge-orange/10 text-badge-orange-strong',
        pink:
          'border-transparent bg-badge-pink/10 text-badge-pink-strong',
        violet:
          'border-transparent bg-badge-violet/10 text-badge-violet-strong',
        emerald:
          'border-transparent bg-badge-emerald/10 text-badge-emerald-strong',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
