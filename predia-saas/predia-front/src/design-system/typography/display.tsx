import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

type DisplayLevel = 'xl' | 'lg' | 'md' | 'sm'

const styles: Record<DisplayLevel, string> = {
  xl: 'text-[64px] font-display font-semibold leading-[1.05] tracking-[-2px]',
  lg: 'text-[48px] font-display font-semibold leading-[1.1] tracking-[-1.5px]',
  md: 'text-[36px] font-display font-semibold leading-[1.15] tracking-[-1px]',
  sm: 'text-[28px] font-display font-semibold leading-[1.2] tracking-[-0.5px]',
}

const tags: Record<DisplayLevel, 'h1' | 'h2' | 'h3' | 'h4'> = {
  xl: 'h1',
  lg: 'h2',
  md: 'h3',
  sm: 'h4',
}

interface DisplayProps {
  as?: DisplayLevel
  className?: string
  children: ReactNode
}

function Display({ as = 'md', className, children }: DisplayProps) {
  const Tag = tags[as]
  return <Tag className={cn(styles[as], className)}>{children}</Tag>
}

export default Display
