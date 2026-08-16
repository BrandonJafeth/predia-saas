import { memo, useMemo, useRef, useState } from 'react'
import { Plus, Loader2, Pencil, Trash2, Check, X } from 'lucide-react'
import { Label } from '@/design-system/ui/label'
import { Input } from '@/design-system/ui/input'
import { Button } from '@/design-system/ui/button'
import { Skeleton } from '@/design-system/ui/skeleton'
import { Text } from '@/design-system/typography'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useAmenities, useCreateAmenity, useRenameAmenity, useDeleteAmenity } from '@/app/amenities/hooks'
import type { Amenity } from '@/app/amenities/types'

interface AmenityPickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  isEdit?: boolean
}

function AmenityPicker({ selectedIds, onChange, isEdit }: AmenityPickerProps) {
  const { data: amenities, isLoading } = useAmenities()
  const { mutate: createAmenity, isPending: isCreating } = useCreateAmenity()
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function toggleAmenity(id: string) {
    const next = new Set(selectedSet)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(Array.from(next))
  }

  function handleCreate() {
    const name = newName.trim()
    if (!name || isCreating) return
    createAmenity(name, {
      onSuccess: (amenity) => {
        setNewName('')
        onChange([...selectedIds, amenity.id])
      },
    })
  }

  function handleDeleted(amenityId: string) {
    if (selectedSet.has(amenityId)) {
      onChange(selectedIds.filter((id) => id !== amenityId))
    }
  }

  return (
    <div className="rounded-xl border border-hairline p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium cursor-pointer">Amenidades</Label>
        <span className="text-[13px] font-body text-muted-foreground block">
          Comodidades disponibles para esta categoría. Las que crees acá quedan
          en el catálogo global, disponibles para todas las categorías.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreate()
            }
          }}
          placeholder="Nueva amenidad (ej. Piscina)"
          className="h-9 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 gap-1.5"
          disabled={!newName.trim() || isCreating}
          onClick={handleCreate}
        >
          {isCreating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          Crear
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : !amenities || amenities.length === 0 ? (
        <Text as="sm" className="text-muted-foreground">
          No hay amenidades disponibles todavía. Creá la primera arriba.
        </Text>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {amenities.map((amenity) => (
            <AmenityChip
              key={amenity.id}
              amenity={amenity}
              checked={selectedSet.has(amenity.id)}
              isEdit={isEdit}
              isEditingName={editingId === amenity.id}
              onToggle={() => toggleAmenity(amenity.id)}
              onStartEdit={() => setEditingId(amenity.id)}
              onStopEdit={() => setEditingId(null)}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface AmenityChipProps {
  amenity: Amenity
  checked: boolean
  isEdit?: boolean
  isEditingName: boolean
  onToggle: () => void
  onStartEdit: () => void
  onStopEdit: () => void
  onDeleted: (amenityId: string) => void
}

// Chip con dos modos: seleccionar (click = toggle, comportamiento normal del
// picker) y renombrar (lápiz reemplaza el label por un input inline). Los
// botones de editar/borrar solo aparecen al hover/focus para no saturar una
// grilla que puede tener 40+ amenidades.
function AmenityChip({
  amenity,
  checked,
  isEdit,
  isEditingName,
  onToggle,
  onStartEdit,
  onStopEdit,
  onDeleted,
}: AmenityChipProps) {
  const { mutate: renameAmenity, isPending: isRenaming } = useRenameAmenity()
  const { mutate: deleteAmenity, isPending: isDeleting } = useDeleteAmenity()
  const [draftName, setDraftName] = useState(amenity.name)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = `${isEdit ? 'edit_' : ''}cat_amenity_${amenity.slug}`

  function handleConfirmDelete() {
    deleteAmenity(amenity.id, {
      onSuccess: () => {
        setConfirmOpen(false)
        onDeleted(amenity.id)
      },
    })
  }

  function startEdit(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDraftName(amenity.name)
    onStartEdit()
    requestAnimationFrame(() => inputRef.current?.select())
  }

  function saveEdit() {
    const name = draftName.trim()
    if (!name || name === amenity.name) {
      onStopEdit()
      return
    }
    renameAmenity({ id: amenity.id, name }, { onSuccess: onStopEdit, onError: onStopEdit })
  }

  if (isEditingName) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-primary bg-canvas px-2 py-1.5">
        <Input
          ref={inputRef}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
            if (e.key === 'Escape') { e.preventDefault(); onStopEdit() }
          }}
          disabled={isRenaming}
          autoFocus
          className="h-7 text-sm border-none shadow-none px-1 focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={saveEdit}
          disabled={isRenaming}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-soft transition-colors shrink-0"
          aria-label="Guardar nombre"
        >
          {isRenaming ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={onStopEdit}
          disabled={isRenaming}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors shrink-0"
          aria-label="Cancelar"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg border pl-3 pr-1 py-2 text-sm transition-colors ${
        checked
          ? 'border-primary bg-primary/5 text-primary font-medium'
          : 'border-hairline bg-surface-soft hover:bg-hairline/50'
      }`}
    >
      <Label htmlFor={id} className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onToggle}
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
        <span className="truncate">{amenity.name}</span>
      </Label>
      <div className="flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={startEdit}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-canvas transition-colors"
          aria-label={`Renombrar ${amenity.name}`}
        >
          <Pencil className="size-3" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmOpen(true) }}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
          aria-label={`Eliminar ${amenity.name}`}
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar amenidad"
        description={`¿Eliminar "${amenity.name}" del catálogo? Desaparece de todas las categorías y propiedades donde esté disponible para elegir. Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        isPending={isDeleting}
      />
    </div>
  )
}

const MemoizedAmenityPicker = memo(AmenityPicker)

export { MemoizedAmenityPicker as AmenityPicker }