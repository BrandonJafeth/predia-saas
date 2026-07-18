import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/design-system/ui/popover'
import { cn } from '@/shared/lib/utils'
import { useProperties, useProperty } from '@/app/properties/hooks'

interface PropertyComboboxProps {
  id?: string
  value: string
  onChange: (id: string) => void
  onBlur?: () => void
}

function PropertyCombobox({ id, value, onChange, onBlur }: PropertyComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Radix Dialog (FormSheet) traps focus within its own DOM subtree. Portaled
  // to document.body by default, this Popover would be a DOM *sibling* of an
  // ancestor Sheet rather than a descendant, so the Sheet's focus trap fights
  // it and yanks focus straight back to the trigger on every keystroke.
  // Portaling inside the nearest dialog fixes that.
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalContainer(triggerRef.current?.closest('[role="dialog"]') as HTMLElement | null)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: selectedProperty } = useProperty(value)
  const { data, isLoading } = useProperties({ search: debouncedQuery || undefined, limit: 20 })
  const results = data?.data ?? []

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          onBlur={onBlur}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate text-left', !value && 'text-muted-foreground')}>
            {value ? selectedProperty?.title ?? 'Cargando...' : 'Ninguna'}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        container={portalContainer}
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título o dirección..."
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
          />
          {isLoading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-surface-soft"
          >
            <X className="size-4" />
            Ninguna
          </button>
          {!isLoading && results.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">
              {debouncedQuery ? 'Sin resultados.' : 'No hay propiedades.'}
            </p>
          )}
          {results.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => { onChange(property.id); setOpen(false) }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-surface-soft"
            >
              <Check className={cn('size-4 shrink-0', property.id === value ? 'opacity-100' : 'opacity-0')} />
              <div className="min-w-0">
                <p className="truncate font-medium">{property.title}</p>
                {property.address && (
                  <p className="truncate text-xs text-muted-foreground">{property.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PropertyCombobox
