import { cn } from '@/shared/lib/utils'
import type { ReactNode } from 'react'

type HeadingLevel = 'lg' | 'md' | 'sm'

const styles: Record<HeadingLevel, string> = {
  lg: 'text-[22px] font-body font-semibold leading-[1.3] tracking-[-0.3px]',
  md: 'text-[18px] font-body font-semibold leading-[1.4]',
  sm: 'text-[16px] font-body font-semibold leading-[1.4]',
}

const tags: Record<HeadingLevel, 'h2' | 'h3' | 'h4'> = {
  lg: 'h2',
  md: 'h3',
  sm: 'h4',
}

interface HeadingProps {
  as?: HeadingLevel
  className?: string
  children: ReactNode
}

function Heading({ as = 'md', className, children }: HeadingProps) {
  const Tag = tags[as]
  return <Tag className={cn(styles[as], className)}>{children}</Tag>
}

export default Heading
