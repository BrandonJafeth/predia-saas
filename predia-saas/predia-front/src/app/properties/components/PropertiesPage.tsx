import { useState } from 'react'
import { Display, Text, Heading } from '@/design-system/typography'
import { Card, CardContent, CardHeader, CardTitle } from '@/design-system/ui/card'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { Plus, MapPin, PencilLine } from 'lucide-react'
import { useProperties } from '../hooks'
import { PropertyForm } from './PropertyForm'
import type { Property } from '../types'

const STATUS_LABELS: Record<Property['status'], string> = {
  draft: 'Borrador',
  active: 'Activa',
  inactive: 'Inactiva',
  sold: 'Vendida',
  rented: 'Arrendada',
  archived: 'Eliminada',
}

const STATUS_VARIANT: Record<Property['status'], 'default' | 'orange' | 'pink' | 'violet' | 'emerald' | null> = {
  draft: null,
  active: 'emerald',
  inactive: null,
  sold: 'violet',
  rented: 'orange',
  archived: 'pink',
}

const CURRENCY_SYMBOL: Record<Property['currency'], string> = {
  CRC: '₡',
  USD: '$',
}

const OPERATION_LABELS: Record<Property['operation_type'], string> = {
  sale: 'Venta',
  rent: 'Alquiler',
  lease: 'Arrendamiento',
}

function formatPrice(price: string, currency: Property['currency']) {
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

function PropertyCard({ property: p, onEdit }: { property: Property; onEdit: (p: Property) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full bg-surface-card" />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{p.title}</CardTitle>
            {p.address && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <Text as="caption" className="truncate">{p.address}</Text>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge variant={STATUS_VARIANT[p.status] ?? undefined}>{STATUS_LABELS[p.status]}</Badge>
            <Badge variant="pink">{OPERATION_LABELS[p.operation_type]}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(p.lot_area_m2 ?? p.built_area_m2) && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            {p.lot_area_m2 && (
              <span>{parseFloat(p.lot_area_m2).toLocaleString('es-CR')} m² lote</span>
            )}
            {p.built_area_m2 && (
              <span>{parseFloat(p.built_area_m2).toLocaleString('es-CR')} m² const.</span>
            )}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <Heading as="sm">{formatPrice(p.price, p.currency)}</Heading>
          <button
            onClick={() => onEdit(p)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-soft transition-colors"
            aria-label="Editar propiedad"
          >
            <PencilLine className="size-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function PropertiesPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const [page, setPage] = useState(1)
  const limit = 15
  const { data, isLoading, error } = useProperties({ page, limit })

  function openCreate() { setEditing(null); setSheetOpen(true) }
  function openEdit(property: Property) { setEditing(property); setSheetOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Display as="sm">Propiedades</Display>
          <Text as="sm" className="text-muted-foreground mt-1">
            Gestiona tu cartera de propiedades
          </Text>
        </div>
        <Button className="self-start sm:self-auto" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva propiedad
        </Button>
      </div>

      <FormSheet
        key={editing?.id ?? 'new'}
        open={sheetOpen}
        onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditing(null) }}
        title={editing ? 'Editar propiedad' : 'Nueva propiedad'}
        description={editing ? 'Modificá los datos de la propiedad.' : 'Completá los datos básicos para crear la propiedad.'}
        onSubmit={() => {}}
        isSubmitting={false}
        submitLabel=""
        hideActions
      >
        <PropertyForm
          initialData={editing ?? undefined}
          onSuccess={() => { setSheetOpen(false); setEditing(null) }}
          onCancel={() => { setSheetOpen(false); setEditing(null) }}
        />
      </FormSheet>

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
          : data?.data.map((p) => <PropertyCard key={p.id} property={p} onEdit={openEdit} />)}
      </div>

      {!isLoading && data?.data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Text as="md" className="font-medium">Sin propiedades aún</Text>
          <Text as="sm" className="text-muted-foreground mt-1">
            Creá tu primera propiedad para comenzar.
          </Text>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva propiedad
          </Button>
        </div>
      )}

      {data?.meta && (
        <PaginationControls
          page={page}
          pageCount={data.meta.pageCount}
          itemCount={data.meta.itemCount}
          limit={limit}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}

export default PropertiesPage
