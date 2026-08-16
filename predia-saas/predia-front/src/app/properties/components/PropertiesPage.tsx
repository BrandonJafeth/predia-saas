import { useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  Check,
  ChevronDown,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MoreHorizontal,
  PencilLine,
  Plus,
  Ruler,
  Trash2,
} from 'lucide-react'
import { Display, Text } from '@/design-system/typography'
import { Card } from '@/design-system/ui/card'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/design-system/ui/popover'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { useLocationsTree } from '@/app/locations/hooks'
import type { LocationNode } from '@/app/locations/types'
import { useDeleteProperty, useProperties, useUpdateProperty } from '../hooks'
import {
  DEFAULT_PAGE_LIMIT,
  OPERATION_LABEL,
  PAGE_LIMIT_OPTIONS,
  PROPERTY_STATUSES,
  STATUS_LABEL,
} from '../constants'
import type { CurrencyCode, Property, PropertyStatus } from '../types'
import PropertiesFilterBar from './PropertiesFilterBar'
import { PropertyFormSheet } from './PropertyFormSheet'

// Color sólido por estado — el badge usa su versión tenue (10% opacity), acá
// necesitamos el punto lleno para la lista del popover.
const STATUS_DOT_CLASS: Record<PropertyStatus, string> = {
  draft: 'bg-ink-soft',
  active: 'bg-badge-emerald',
  inactive: 'bg-ink-soft',
  sold: 'bg-badge-violet',
  rented: 'bg-badge-orange',
  archived: 'bg-badge-pink',
}

// Tailwind no puede resolver `text-badge-${variant}-strong` armado en runtime
// (su scanner necesita ver el string completo en el source) — mapa explícito.
const STATUS_TEXT_CLASS: Record<PropertyStatus, string> = {
  draft: 'text-ink-body',
  active: 'text-badge-emerald-strong',
  inactive: 'text-ink-body',
  sold: 'text-badge-violet-strong',
  rented: 'text-badge-orange-strong',
  archived: 'text-badge-pink-strong',
}

const routeApi = getRouteApi('/properties')

const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  CRC: '₡',
  USD: '$',
}

function formatPrice(price: string, currency: CurrencyCode) {
  const n = parseFloat(price)
  return `${CURRENCY_SYMBOL[currency]}${n.toLocaleString('es-CR')}`
}

function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-hairline/70">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="mt-3 h-5 w-2/5" />
      </div>
    </Card>
  )
}

// Estados que ya no están "en el mercado" — la imagen se apaga un poco para
// que se note de un vistazo que esa unidad no está disponible, sin tener que
// leer el badge.
const UNAVAILABLE_STATUSES: ReadonlySet<Property['status']> = new Set(['sold', 'rented', 'inactive'])

interface PropertyCardProps {
  property: Property
  locationNameById: Map<string, string>
  onView: (p: Property) => void
  onEdit: (p: Property) => void
  onDelete: (p: Property) => void
}

function PropertyCard({ property: p, locationNameById, onView, onEdit, onDelete }: PropertyCardProps) {
  const isUnavailable = UNAVAILABLE_STATUSES.has(p.status)
  const [statusOpen, setStatusOpen] = useState(false)
  const { mutate: updateProperty, isPending: isChangingStatus } = useUpdateProperty()

  function handleStatusChange(status: PropertyStatus) {
    if (status === p.status) { setStatusOpen(false); return }
    updateProperty({ id: p.id, status }, { onSuccess: () => setStatusOpen(false) })
  }

  return (
    <Card
      className="group overflow-hidden rounded-2xl border-hairline/70 cursor-pointer transition-all duration-300 hover:shadow-raised hover:-translate-y-0.5"
      onClick={() => onView(p)}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-card">
        {p.cover_image ? (
          <img
            src={p.cover_image.url}
            alt={p.title}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${
              isUnavailable ? 'grayscale-[35%] opacity-80' : ''
            }`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Estado: badge interactivo, cambia sin abrir el form completo */}
        <div className="absolute left-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={isChangingStatus}
                className="inline-flex items-center gap-1 rounded-full border-0 bg-canvas/90 backdrop-blur-sm px-2.5 py-1 text-caption font-body shadow-sm transition-colors hover:bg-canvas disabled:opacity-70"
              >
                <span className={`size-1.5 rounded-full ${STATUS_DOT_CLASS[p.status]}`} />
                <span className={STATUS_TEXT_CLASS[p.status]}>
                  {STATUS_LABEL[p.status]}
                </span>
                {isChangingStatus ? (
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-3 text-muted-foreground" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1">
              {PROPERTY_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-soft transition-colors"
                >
                  <span className={`size-1.5 rounded-full shrink-0 ${STATUS_DOT_CLASS[s]}`} />
                  <span className="flex-1">{STATUS_LABEL[s]}</span>
                  {s === p.status && <Check className="size-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="absolute right-2.5 top-2.5" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full bg-canvas/90 backdrop-blur-sm shadow-sm hover:bg-canvas"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Acciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onView(p)}>
                <Eye />
                <span>Ver</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(p)}>
                <PencilLine />
                <span>Editar</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(p)}
              >
                <Trash2 />
                <span>Eliminar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div>
          <Text as="sm" className="font-semibold text-foreground truncate leading-tight">
            {p.title}
          </Text>
          <div className="flex items-center gap-1 text-muted-foreground mt-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate text-[13px] font-body">
              {p.location_id
                ? (locationNameById.get(p.location_id) ?? 'Ubicación desconocida')
                : 'Sin ubicación'}
            </span>
          </div>
        </div>

        {/* Meta compacta, estilo Airbnb: "Casa · 500 m² lote · 200 m² const." */}
        {(p.lot_area_m2 ?? p.built_area_m2 ?? p.subtype) && (
          <div className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-body text-muted-foreground">
            {p.subtype && <span>{p.subtype}</span>}
            {p.subtype && (p.lot_area_m2 ?? p.built_area_m2) && <span className="text-hairline">·</span>}
            {p.lot_area_m2 && (
              <span className="inline-flex items-center gap-1">
                <Ruler className="size-3" />
                {parseFloat(p.lot_area_m2).toLocaleString('es-CR')} m² lote
              </span>
            )}
            {p.lot_area_m2 && p.built_area_m2 && <span className="text-hairline">·</span>}
            {p.built_area_m2 && <span>{parseFloat(p.built_area_m2).toLocaleString('es-CR')} m² const.</span>}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-hairline-soft">
          <span className="text-xl font-display font-bold text-foreground tabular-nums truncate pt-1.5">
            {formatPrice(p.price, p.currency)}
          </span>
          <Badge variant="pink" className="shrink-0 font-medium px-3">{OPERATION_LABEL[p.operation_type]}</Badge>
        </div>
      </div>
    </Card>
  )
}

function PropertiesPage() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [formState, setFormState] = useState<{ mode: 'create' } | { mode: 'edit'; property: Property } | null>(null)
  const { mutate: deleteProperty, isPending: isDeleting } = useDeleteProperty()

  const { data: locationTree } = useLocationsTree()
  const locationNameById = useMemo(() => {
    const map = new Map<string, string>()
    const walk = (nodes: LocationNode[]) => {
      for (const node of nodes) {
        map.set(node.id, node.name)
        if (node.children?.length) walk(node.children)
      }
    }
    if (locationTree) walk(locationTree)
    return map
  }, [locationTree])

  const limit = search.limit ?? DEFAULT_PAGE_LIMIT

  const filters = useMemo(() => ({
    page: search.page ?? 1,
    limit,
    ...(search.search ? { search: search.search } : {}),
    ...(search.operation_type ? { operation_type: search.operation_type } : {}),
    ...(search.status ? { status: search.status } : {}),
    ...(search.location_id ? { location_id: search.location_id } : {}),
  }), [search, limit])

  const { data, isLoading, error } = useProperties(filters)

  const hasActiveFilters =
    !!search.search ||
    search.operation_type !== undefined ||
    search.status !== undefined ||
    search.location_id !== undefined

  function updateSearch(patch: Partial<typeof search>, resetPage = true) {
    navigate({
      search: (prev) => ({ ...prev, ...patch, ...(resetPage ? { page: 1 } : {}) }),
    })
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return
    deleteProperty(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Display as="sm">Propiedades</Display>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona tu cartera de propiedades
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(v) => navigate({ search: (prev) => ({ ...prev, limit: Number(v), page: 1 }) })}
            >
              <SelectTrigger aria-label="Propiedades por página" className="h-9 w-auto rounded-lg border-hairline bg-canvas text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_LIMIT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} / página</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="self-start sm:self-auto" onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Nueva propiedad
          </Button>
        </div>
      </div>

      <PropertiesFilterBar
        search={search.search ?? ''}
        onSearchChange={(v) => updateSearch({ search: v || undefined })}
        operation={search.operation_type}
        onOperationChange={(v) => updateSearch({ operation_type: v })}
        status={search.status}
        onStatusChange={(v) => updateSearch({ status: v })}
        locationId={search.location_id}
        onLocationIdChange={(v) => updateSearch({ location_id: v })}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Eliminar propiedad"
        description={`¿Seguro que deseas eliminar ${deleteTarget?.title}? Dejará de aparecer en el listado.`}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <Text as="sm" className="text-destructive">
            Error al cargar propiedades. Intentá de nuevo.
          </Text>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)
          : data?.data.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                locationNameById={locationNameById}
                onView={(prop) => setFormState({ mode: 'edit', property: prop })}
                onEdit={(prop) => setFormState({ mode: 'edit', property: prop })}
                onDelete={setDeleteTarget}
              />
            ))}
      </div>

      {!isLoading && data?.data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Text as="md" className="font-medium">
            {hasActiveFilters ? 'Sin resultados' : 'Sin propiedades aún'}
          </Text>
          <Text as="sm" className="text-muted-foreground mt-1">
            {hasActiveFilters
              ? 'Ninguna propiedad coincide con los filtros seleccionados.'
              : 'Creá tu primera propiedad para comenzar.'}
          </Text>
          {hasActiveFilters ? (
            <Button variant="outline" className="mt-4" onClick={() => navigate({ to: '/properties', search: {} })}>
              Limpiar filtros
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => setFormState({ mode: 'create' })}>
              <Plus className="h-4 w-4" />
              Nueva propiedad
            </Button>
          )}
        </div>
      )}

      <PropertyFormSheet
        open={formState !== null}
        onOpenChange={(open) => { if (!open) setFormState(null) }}
        mode={formState?.mode ?? 'create'}
        property={formState?.mode === 'edit' ? formState.property : null}
      />

      {data?.meta && (
        <PaginationControls
          page={search.page ?? 1}
          pageCount={data.meta.pageCount}
          itemCount={data.meta.itemCount}
          limit={limit}
          onPageChange={(page) => navigate({ search: (prev) => ({ ...prev, page }) })}
        />
      )}
    </div>
  )
}

export default PropertiesPage
