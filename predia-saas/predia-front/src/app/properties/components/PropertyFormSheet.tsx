import { Loader2 } from 'lucide-react'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { PropertyForm } from './PropertyForm'
import { useProperty } from '../hooks'
import type { Property } from '../types'

interface PropertyFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  property?: Property | null
}

function PropertyFormSheet({ open, onOpenChange, mode, property }: PropertyFormSheetProps) {
  const isEdit = mode === 'edit'
  const propertyId = isEdit ? property?.id ?? '' : ''
  const { data: detail, isLoading } = useProperty(propertyId)

  // En edit mode esperamos el detalle completo (incluye amenities) para no
  // inicializar el form con datos del listado o de otra propiedad en cache.
  const showLoader = isEdit && open && (isLoading || detail?.id !== propertyId)

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
      description={
        isEdit
          ? 'Modificá los datos de la propiedad.'
          : 'Completá los datos básicos para crear la propiedad.'
      }
      hideActions
      onSubmit={() => {}}
    >
      {showLoader ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PropertyForm
          key={propertyId || 'new'}
          initialData={isEdit && detail ? detail : undefined}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      )}
    </FormSheet>
  )
}

export { PropertyFormSheet }
