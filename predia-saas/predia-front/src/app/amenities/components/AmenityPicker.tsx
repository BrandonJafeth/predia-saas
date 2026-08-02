import { memo, useMemo } from 'react'
import { Label } from '@/design-system/ui/label'
import { Skeleton } from '@/design-system/ui/skeleton'
import { Text } from '@/design-system/typography'
import { useAmenities } from '@/app/amenities/hooks'

interface AmenityPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  isEdit?: boolean
}

function AmenityPicker({ selectedIds, onChange, isEdit }: AmenityPickerProps) {
  const { data: amenities, isLoading } = useAmenities()
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  function toggleAmenity(id: string) {
    const next = new Set(selectedSet)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  return (
    <div className="rounded-xl border border-hairline p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium cursor-pointer">Amenidades</Label>
        <span className="text-[13px] font-body text-muted-foreground block">
          Comodidades disponibles para esta categoría.
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : !amenities || amenities.length === 0 ? (
        <Text as="sm" className="text-muted-foreground">
          No hay amenidades disponibles. Contactá al administrador.
        </Text>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {amenities.map((amenity) => {
            const checked = selectedSet.has(amenity.id)
            const id = `${isEdit ? 'edit_' : ''}cat_amenity_${amenity.slug}`
            return (
              <Label
                key={amenity.id}
                htmlFor={id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-hairline bg-surface-soft hover:bg-hairline/50'
                }`}
              >
                <input
                  type="checkbox"
                  id={id}
                  checked={checked}
                  onChange={() => toggleAmenity(amenity.id)}
                  className="sr-only"
                />
                <span
                  className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked ? 'bg-primary border-primary' : 'border-hairline bg-canvas'
                  }`}
                >
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                {amenity.name}
              </Label>
            )
          })}
        </div>
      )}
    </div>
  )
}

const MemoizedAmenityPicker = memo(AmenityPicker)

export { MemoizedAmenityPicker as AmenityPicker }