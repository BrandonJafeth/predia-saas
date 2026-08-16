import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface AccordionContextValue {
  openValue: string | null
  setOpenValue: (value: string | null) => void
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

function useAccordionContext(): AccordionContextValue {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error('AccordionItem debe usarse dentro de <Accordion>')
  return ctx
}

interface AccordionProps {
  value: string | null
  onValueChange: (value: string | null) => void
  children: React.ReactNode
  className?: string
}

// Un solo item abierto a la vez (acordeón clásico) — construido sobre
// Collapsible en vez de @radix-ui/react-accordion para no sumar una
// dependencia nueva cuando ya está instalado lo necesario.
function Accordion({ value, onValueChange, children, className }: AccordionProps) {
  return (
    <AccordionContext.Provider value={{ openValue: value, setOpenValue: onValueChange }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps {
  value: string
  icon: LucideIcon
  title: string
  description?: string
  hasError?: boolean
  children: React.ReactNode
}

function AccordionItem({ value, icon: Icon, title, description, hasError, children }: AccordionItemProps) {
  const { openValue, setOpenValue } = useAccordionContext()
  const open = openValue === value

  return (
    <CollapsiblePrimitive.Root
      open={open}
      onOpenChange={(next) => setOpenValue(next ? value : null)}
      className="rounded-xl border border-hairline bg-canvas overflow-hidden transition-shadow"
    >
      <CollapsiblePrimitive.Trigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-soft/60 transition-colors focus-ring"
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors',
              open ? 'bg-primary text-on-primary' : 'bg-surface-soft text-muted-foreground',
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {title}
              {hasError && (
                <span className="size-1.5 rounded-full bg-destructive shrink-0" aria-label="Sección con errores" />
              )}
            </span>
            {description && !open && (
              <span className="block text-[13px] font-body text-muted-foreground truncate mt-0.5">
                {description}
              </span>
            )}
          </span>
          <ChevronRight
            className={cn('size-4 text-muted-foreground shrink-0 transition-transform duration-200', open && 'rotate-90')}
          />
        </button>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-hairline">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}

export { Accordion, AccordionItem }