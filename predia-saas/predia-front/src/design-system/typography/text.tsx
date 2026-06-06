import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

type TextLevel = 'md' | 'sm' | 'caption'

const styles: Record<TextLevel, string> = {
  md: 'text-[16px] font-body font-normal leading-[1.5]',
  sm: 'text-[14px] font-body font-normal leading-[1.5]',
  caption: 'text-[13px] font-body font-medium leading-[1.4]',
}

interface TextProps {
  as?: TextLevel
  className?: string
  children: ReactNode
}

function Text({ as = 'md', className, children }: TextProps) {
  return <p className={cn(styles[as], className)}>{children}</p>
}

export default Text
