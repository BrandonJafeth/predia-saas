import { useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { AlertTriangle, Eye, Image as ImageIcon, Loader2, MapPin, MoreHorizontal, PencilLine, Plus, Trash2 } from 'lucide-react'
import { Display, Text, Heading } from '@/design-system/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/ui/card'
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
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { useLocationsTree } from '@/app/locations/hooks'
import type { LocationNode } from '@/app/locations/types'
import { useDeleteProperty, useProperties } from '../hooks'
import {
  CURRENCY_LABEL,
  DEFAULT_PAGE_LIMIT,
  OPERATION_LABEL,
  PAGE_LIMIT_OPTIONS,
  STATUS_LABEL,
  STATUS_VARIANT,
} from '../constants'
import type { CurrencyCode, Property } from '../types'
import PropertiesFilterBar from './PropertiesFilterBar'
import { PropertyFormSheet } from './PropertyFormSheet'

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
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-1 h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-6 w-1/3" />
      </CardContent>
    </Card>
  )
}

interface PropertyCardProps {
  property: Property
  locationNameById: Map<string, string>
  onView: (p: Property) => void
  onEdit: (p: Property) => void
  onDelete: (p: Property) => void
}

function PropertyCard({ property: p, locationNameById, onView, onEdit, onDelete }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-surface-card">
        {p.cover_image ? (
          <img
            src={p.cover_image.url}
            alt={p.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        <div className="absolute right-2.5 top-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full bg-canvas/80 backdrop-blur-sm hover:bg-canvas"
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

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="truncate text-base">{p.title}</CardTitle>
          <Badge variant={STATUS_VARIANT[p.status] ?? undefined}>{STATUS_LABEL[p.status]}</Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="pink">{OPERATION_LABEL[p.operation_type]}</Badge>
          {p.subtype && <Badge>{p.subtype}</Badge>}
          <Badge variant="default">{CURRENCY_LABEL[p.currency]}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {p.location_id ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {locationNameById.get(p.location_id) ?? 'Ubicación desconocida'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <Badge variant="default">Sin ubicación</Badge>
            </div>
          )}
          {p.address && <span className="block truncate">{p.address}</span>}
          {(p.lot_area_m2 ?? p.built_area_m2) && (
            <div className="flex gap-3">
              {p.lot_area_m2 && (
                <span>{parseFloat(p.lot_area_m2).toLocaleString('es-CR')} m² lote</span>
              )}
              {p.built_area_m2 && (
                <span>{parseFloat(p.built_area_m2).toLocaleString('es-CR')} m² const.</span>
              )}
            </div>
          )}
          <span className="block">
            {new Date(p.created_at).toLocaleDateString('es-CR')}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Heading as="sm">{formatPrice(p.price, p.currency)}</Heading>
        </div>
      </CardContent>
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

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Eliminar propiedad
            </DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar {deleteTarget?.title}? Dejará de aparecer en el listado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              Eliminar
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
