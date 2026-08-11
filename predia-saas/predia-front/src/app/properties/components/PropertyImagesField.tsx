import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { Heading, Text } from '@/design-system/typography'
import { Button } from '@/design-system/ui/button'
import { Badge } from '@/design-system/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/design-system/ui/dialog'
import { useProperty } from '../hooks'
import {
  useDeletePropertyImage,
  useReorderPropertyImages,
  useSetPropertyCover,
} from '../hooks/property-images'
import { cn } from '@/shared/lib/utils'
import type { PropertyImage } from '../types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface SortableThumbnailProps {
  image: PropertyImage
  index: number
  isCover: boolean
  coverPending: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  onSetCover: (imageId: string) => void
  onDelete: (image: PropertyImage) => void
  onMove: (imageId: string, direction: -1 | 1) => void
}

function SortableThumbnail({
  image,
  index,
  isCover,
  onDelete,
}: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-soft',
        isDragging && 'z-10 opacity-50',
        isCover && 'ring-2 ring-primary',
      )}
    >
      <img
        src={image.url}
        alt={`Imagen ${index + 1} de la propiedad`}
        className="h-full w-full object-cover"
      />

      {/* Barra superior: drag handle + eliminar */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-ink/50 to-transparent p-1.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="inline-flex h-7 w-7 touch-none cursor-grab items-center justify-center rounded-md text-white/90 hover:bg-white/15 focus-ring"
          aria-label={`Arrastrar imagen ${index + 1}`}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(image)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/90 hover:bg-destructive hover:text-white focus-ring"
          aria-label={`Eliminar imagen ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  )
}

interface PropertyImagesFieldProps {
  propertyId?: string
  files: File[]
  onChangeFiles: (files: File[]) => void
}

/**
 * Sección de imágenes embebida en el formulario de propiedad.
 * - En modo edición (propertyId) muestra las imágenes existentes con reorden, portada y borrado.
 * - Siempre permite encolar archivos (drag & drop) que el formulario sube al guardar,
 *   para que funcione igual al crear (cuando todavía no existe un propertyId).
 */
function PropertyImagesField({ propertyId, files, onChangeFiles }: PropertyImagesFieldProps) {
  const { data: detail, isLoading } = useProperty(propertyId ?? '')
  const images = detail?.images ?? []
  const maxImages = propertyId ? (detail?.max_images_per_property ?? Infinity) : Infinity

  const [isDragActive, setIsDragActive] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<PropertyImage | null>(null)
  const [coverPendingId, setCoverPendingId] = useState<string | null>(null)

  const previewUrls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url)
    }
  }, [previewUrls])

  const deleteMutation = useDeletePropertyImage(propertyId ?? '')
  const coverMutation = useSetPropertyCover(propertyId ?? '')
  const { reorder } = useReorderPropertyImages(propertyId ?? '')

  const remaining =
    maxImages === Infinity ? Infinity : Math.max(0, maxImages - images.length - files.length)
  const atLimit = remaining === 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addFiles = (list: FileList | File[]) => {
    const accepted = Array.from(list).filter(
      (file) => ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE,
    )
    if (accepted.length === 0) return
    const toAdd = accepted.slice(0, remaining)
    if (toAdd.length === 0) return
    onChangeFiles([...files, ...toAdd])
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragActive(false)
    addFiles(e.dataTransfer.files)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    reorder(arrayMove(images, oldIndex, newIndex))
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    const index = images.findIndex((img) => img.id === imageId)
    const target = index + direction
    if (index === -1 || target < 0 || target >= images.length) return
    reorder(arrayMove(images, index, target))
  }

  function handleSetCover(imageId: string) {
    setCoverPendingId(imageId)
    coverMutation.mutate(imageId, {
      onSettled: () => setCoverPendingId(null),
    })
  }

  function confirmDelete() {
    if (!imageToDelete) return
    deleteMutation.mutate(imageToDelete.id)
    setImageToDelete(null)
  }

  return (
    <div className="space-y-4">
      {/* Encabezado: contador de uso del plan */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-muted-foreground" />
          <Heading as="sm">Imágenes</Heading>
        </div>
        {maxImages !== Infinity && (
          <Badge variant={atLimit ? 'pink' : undefined}>
            {images.length + files.length} de {maxImages} · {remaining} disponibles
          </Badge>
        )}
      </div>

      {/* Imágenes existentes (solo edición) */}
      {propertyId &&
        (isLoading && images.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-hairline bg-surface-soft">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : images.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((image, index) => (
                  <SortableThumbnail
                    key={image.id}
                    image={image}
                    index={index}
                    isCover={image.is_cover}
                    coverPending={coverPendingId === image.id}
                    canMoveUp={index > 0}
                    canMoveDown={index < images.length - 1}
                    onSetCover={handleSetCover}
                    onDelete={setImageToDelete}
                    onMove={moveImage}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : null)}

      {/* Previews de archivos encolados (aún no subidos) */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-hairline bg-surface-soft"
            >
              <img
                src={previewUrls[index]}
                alt="Vista previa antes de subir"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 top-0 flex justify-end p-1.5">
                <button
                  type="button"
                  onClick={() => onChangeFiles(files.filter((_, i) => i !== index))}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-ink/50 text-white hover:bg-destructive focus-ring"
                  aria-label="Quitar imagen de la cola"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-ink/60 to-transparent p-1.5">
                <Text as="caption" className="text-white">Por subir</Text>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!atLimit) setIsDragActive(true)
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline bg-surface-soft/60 px-4 py-8',
          isDragActive && 'border-primary bg-primary/5',
          atLimit && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(',')}
          className="sr-only"
          disabled={atLimit}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <UploadCloud className="size-6 text-muted-foreground" />
        <Text as="sm" className="font-medium">
          {atLimit
            ? 'Límite de imágenes alcanzado'
            : isDragActive
              ? 'Soltá las imágenes aquí'
              : 'Arrastrá y soltá las imágenes o hacé clic para seleccionar'}
        </Text>
        <Text as="caption" className="text-muted-foreground">
          JPG, PNG o WebP · máx. 5MB cada una
        </Text>
      </label>

      {images.length === 0 && files.length === 0 && !isLoading && (
        <Text as="sm" className="text-muted-foreground">
          Esta propiedad aún no tiene imágenes. La primera que subas será la portada.
        </Text>
      )}

      {/* Confirmación de eliminación */}
      <Dialog
        open={!!imageToDelete}
        onOpenChange={(open) => {
          if (!open) setImageToDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar imagen</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que querés eliminar esta imagen? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setImageToDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PropertyImagesField }
