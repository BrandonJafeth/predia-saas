import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  Loader2,
  FileText,
  Home,
  MapPin,
  Camera,
  Settings,
  Crosshair,
} from 'lucide-react'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { Switch } from '@/design-system/ui/switch'
import { Checkbox } from '@/design-system/ui/checkbox'
import { Label } from '@/design-system/ui/label'
import { Button } from '@/design-system/ui/button'
import { FormField } from '@/shared/components/form-field'
import { Accordion, AccordionItem } from '@/design-system/ui/accordion'
import { useCreateProperty, useUpdateProperty } from '../hooks'
import { useAddPropertyAmenities, useRemovePropertyAmenities } from '@/app/amenities/hooks'
import { useCategories } from '@/app/categories/hooks'
import { useProvinces, useLocationsTree, useLocationChildren } from '@/app/locations/hooks'
import { propertyFormSchema } from '../types/create-property.schema'
import { DynamicAttributeFields } from './DynamicAttributeFields'
import { validateAttributes } from '../utils/build-attributes-schema'
import { PropertyImagesField } from './PropertyImagesField'
import { propertyImagesService } from '../services/property-images.service'
import { propertyKeys, type PropertyDetail, type PropertyStatus, type CreatePropertyRequest } from '../types'
import { PROPERTY_STATUSES, STATUS_LABEL } from '../constants'
import { notify, extractApiError } from '@/shared/lib/notifications'

const NONE_VALUE = '__none__'

interface PropertyFormProps {
  initialData?: PropertyDetail
  onSuccess?: (id?: string) => void
  onCancel?: () => void
}

function PropertyForm({ initialData, onSuccess, onCancel }: PropertyFormProps) {
  const isEdit = !!initialData
  const navigate = useNavigate()

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { mutate: createProperty, isPending: isCreating } = useCreateProperty()
  const { mutate: updateProperty, isPending: isUpdating } = useUpdateProperty()
  const { mutateAsync: addPropertyAmenities } = useAddPropertyAmenities()
  const { mutateAsync: removePropertyAmenities } = useRemovePropertyAmenities()
  const isPending = isCreating || isUpdating

  const queryClient = useQueryClient()
  const [queuedFiles, setQueuedFiles] = useState<File[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

  const uploadQueuedImages = async (propertyId: string) => {
    const files = queuedFiles
    if (files.length === 0) return
    setQueuedFiles([])
    for (const file of files) {
      try {
        await propertyImagesService.uploadImage(propertyId, file)
      } catch (err) {
        notify.error({ title: 'Error al subir imagen', description: extractApiError(err) })
      }
    }
    queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) })
  }

  const categories = categoriesData ?? []

  const { data: provinces } = useProvinces()
  const { data: locationTree } = useLocationsTree()

  // Transform initialData attributes to string values for the form
  const defaultAttributes = useMemo(() => {
    const attrs: Record<string, string> = {}
    if (initialData?.attributes) {
      for (const [k, v] of Object.entries(initialData.attributes)) {
        attrs[k] = String(v)
      }
    }
    return attrs
  }, [initialData?.attributes])

  // UI-level selection tracking for the hierarchical selects
  const [uiProvinceId, setUiProvinceId] = useState('')
  const [uiCantonId, setUiCantonId] = useState('')

  // Lat/lng colapsados por defecto — la mayoría carga ubicación por
  // provincia/cantón/distrito, no coordenadas exactas. Se abren solos si la
  // propiedad ya las tenía cargadas.
  const [showCoordinates, setShowCoordinates] = useState(
    () => initialData?.lat != null && initialData?.lng != null,
  )

  // Acordeón: una sección visible a la vez para no abrumar con todo el form
  // de una — "Información básica" abierta por default, es lo primero que
  // se llena siempre.
  const [openSection, setOpenSection] = useState<string | null>('basic')
  const [erroredSections, setErroredSections] = useState<Set<string>>(new Set())

  // Fuera de tanstack-form: no participa de la validación zod del resto del
  // form (propertyFormSchema no lo declara) y no aplica en creación — una
  // property nueva siempre arranca en draft, status solo se cambia editando.
  const [statusValue, setStatusValue] = useState<PropertyStatus>(initialData?.status ?? 'draft')

  const form = useForm({
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      price: initialData?.price ?? '',
      operation_type: (initialData?.operation_type ?? '') as string,
      currency: (initialData?.currency ?? 'CRC') as 'CRC' | 'USD',
      category_id: initialData?.category_id ?? '',
      subtype: initialData?.subtype ?? '',
      address: initialData?.address ?? '',
      lat: initialData?.lat ?? '',
      lng: initialData?.lng ?? '',
      location_id: initialData?.location_id ?? '',
      is_published: initialData?.is_published ?? false,
      attributes: defaultAttributes,
    },
    validators: { onSubmit: propertyFormSchema },
    onSubmit: ({ value }) => {
      const payload: CreatePropertyRequest = {
        title: value.title.trim(),
        price: Number(value.price),
        operation_type: value.operation_type as 'sale' | 'rent' | 'lease',
        currency: value.currency,
        category_id: value.category_id,
        is_published: value.is_published,
        ...(value.description.trim() ? { description: value.description.trim() } : {}),
        ...(value.subtype.trim() ? { subtype: value.subtype.trim() } : {}),
        ...(value.address.trim() ? { address: value.address.trim() } : {}),
        ...(value.location_id ? { location_id: value.location_id } : {}),
      }

      // Build dynamic attributes from category schema
      const attributes: Record<string, unknown> = {}
      const attrSchema = selectedCategory?.attribute_schema
      if (attrSchema?.properties && value.attributes) {
        for (const [key, prop] of Object.entries(attrSchema.properties)) {
          const raw = value.attributes[key]
          if (raw !== undefined && raw !== '') {
            const types = Array.isArray(prop.type) ? prop.type : [prop.type]
            const primaryType = types[0]
            if (primaryType === 'number' || primaryType === 'integer') {
              attributes[key] = Number(raw)
            } else if (primaryType === 'boolean') {
              attributes[key] = raw === 'true'
            } else if (primaryType === 'array' && prop.items?.enum) {
              attributes[key] = raw.split(',').map((s) => s.trim()).filter(Boolean)
            } else {
              attributes[key] = raw
            }
          }
        }
      }
      if (Object.keys(attributes).length > 0) {
        payload.attributes = attributes
      }

      const hasLat = value.lat !== ''
      const hasLng = value.lng !== ''
      if (hasLat && hasLng) {
        payload.lat = Number(value.lat)
        payload.lng = Number(value.lng)
      }

      if (isEdit && initialData) {
        updateProperty(
          { id: initialData.id, ...payload, status: statusValue },
          {
            onSuccess: () => {
              void (async () => {
                await finalizeSave(initialData.id)
                form.reset()
                if (onSuccess) onSuccess(initialData.id)
                else navigate({ to: '/properties' })
              })()
            },
            onError: (err) => {
              const msg = extractApiError(err).toLowerCase()
              if (msg.includes('title')) {
                ;(form as any).setFieldMeta('title', (prev: any) => ({ ...prev, errors: [extractApiError(err)] }))
              }
            },
          },
        )
      } else {
        createProperty(payload, {
            onSuccess: (data) => {
              void (async () => {
                const id = data?.id
                if (id) await finalizeSave(id)
                form.reset()
                if (onSuccess) onSuccess(id)
                else navigate({ to: '/properties' })
              })()
            },
          onError: (err) => {
            const msg = extractApiError(err).toLowerCase()
            if (msg.includes('title')) {
              ;(form as any).setFieldMeta('title', (prev: any) => ({ ...prev, errors: [extractApiError(err)] }))
            }
          },
        })
      }
    },
  })

  const categoryId = useStore(form.baseStore, (s) => s.values.category_id)
  const attributes = useStore(form.baseStore, (s) => s.values.attributes)
  const locationId = useStore(form.baseStore, (s) => s.values.location_id)
  const titleValue = useStore(form.baseStore, (s) => s.values.title)
  const addressValue = useStore(form.baseStore, (s) => s.values.address)
  const isPublishedValue = useStore(form.baseStore, (s) => s.values.is_published)

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  )

  const existingAmenityIds = useMemo(() => {
    if (!initialData?.amenities) return new Set<string>()
    return new Set(initialData.amenities.map((a) => a.amenity_id))
  }, [initialData?.amenities])

  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(() =>
    isEdit && initialData?.amenities?.length
      ? new Set(initialData.amenities.map((a) => a.amenity_id))
      : new Set<string>(),
  )

  const toggleAmenity = useCallback((id: string) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const syncPropertyAmenities = useCallback(
    async (propertyId: string) => {
      const toAdd = [...selectedAmenityIds].filter((id) => !existingAmenityIds.has(id))
      const toRemove = [...existingAmenityIds].filter((id) => !selectedAmenityIds.has(id))
      if (toAdd.length > 0) await addPropertyAmenities({ propertyId, amenityIds: toAdd })
      if (toRemove.length > 0) await removePropertyAmenities({ propertyId, amenityIds: toRemove })
    },
    [selectedAmenityIds, existingAmenityIds, addPropertyAmenities, removePropertyAmenities],
  )

  // Espera imágenes + amenidades y refresca el detalle antes de cerrar, para que
  // al reabrir el form las amenidades ya estén actualizadas en cache.
  const finalizeSave = async (id: string) => {
    setIsUploadingImages(true)
    try {
      await uploadQueuedImages(id)
      try {
        await syncPropertyAmenities(id)
      } catch {
        // las mutaciones de amenidades ya notifican el error; no bloquear el cierre
      }
      await queryClient.refetchQueries({ queryKey: propertyKeys.detail(id) })
    } finally {
      setIsUploadingImages(false)
    }
  }

  const attributeErrors = useMemo(
    () => validateAttributes(selectedCategory?.attribute_schema, attributes),
    [selectedCategory, attributes],
  )

  // Track previous category_id to clear attributes on change
  const prevCategoryRef = useRef(categoryId)
  useEffect(() => {
    const currentCat = categoryId
    if (currentCat !== prevCategoryRef.current) {
      prevCategoryRef.current = currentCat
      form.setFieldValue('attributes', {}, { dontValidate: true })
    }
  }, [categoryId, form])

  // Derive province/canton from location_id + full location tree (for edit mode)
  const derivedLocation = useMemo(() => {
    if (!locationId || !locationTree) return null
    for (const province of locationTree) {
      if (!province.children) continue
      for (const canton of province.children) {
        if (!canton.children) continue
        if (canton.children.some((d) => d.id === locationId)) {
          return { provinceId: province.id, cantonId: canton.id }
        }
      }
    }
    return null
  }, [locationId, locationTree])

  const effectiveProvinceId = derivedLocation?.provinceId ?? uiProvinceId
  const effectiveCantonId = derivedLocation?.cantonId ?? uiCantonId

  const { data: cantons } = useLocationChildren(effectiveProvinceId || null)
  const { data: districts } = useLocationChildren(effectiveCantonId || null)

  const handleProvinceChange = useCallback((id: string) => {
    setUiProvinceId(id)
    setUiCantonId('')
    form.setFieldValue('location_id', '', { dontValidate: true })
  }, [form])

  const handleCantonChange = useCallback((id: string) => {
    setUiCantonId(id)
    form.setFieldValue('location_id', '', { dontValidate: true })
  }, [form])

  const handleDistrictChange = useCallback((id: string) => {
    form.setFieldValue('location_id', id === NONE_VALUE ? '' : id, { dontValidate: true })
  }, [form])

  const clearLocation = useCallback(() => {
    setUiProvinceId('')
    setUiCantonId('')
    form.setFieldValue('location_id', '', { dontValidate: true })
  }, [form])

  // Texto de una línea por sección cerrada — deja ver de un vistazo qué tan
  // completo está el form sin tener que abrir cada acordeón.
  const filledAttributeCount = Object.values(attributes ?? {}).filter((v) => v !== '').length
  const totalAttributeCount = Object.keys(selectedCategory?.attribute_schema?.properties ?? {}).length
  const imageCount = (initialData?.images.length ?? 0) + queuedFiles.length

  const basicPreview = titleValue.trim() || 'Sin completar'
  const featuresPreview = !categoryId
    ? 'Elegí una categoría primero'
    : `${filledAttributeCount}/${totalAttributeCount} campos · ${selectedAmenityIds.size} amenidad${selectedAmenityIds.size === 1 ? '' : 'es'}`
  const locationPreview = addressValue.trim() || (locationId ? 'Ubicación seleccionada' : 'Sin ubicación')
  const imagesPreview = imageCount === 0 ? 'Sin imágenes' : `${imageCount} imagen${imageCount === 1 ? '' : 'es'}`
  const settingsPreview = isEdit
    ? `${STATUS_LABEL[statusValue]} · ${isPublishedValue ? 'Publicado' : 'No publicado'}`
    : isPublishedValue ? 'Publicado' : 'Borrador'

  const BASIC_FIELDS = new Set(['title', 'operation_type', 'category_id', 'price', 'currency'])
  const LOCATION_FIELDS = new Set(['lat', 'lng', 'address', 'location_id'])

  // Antes de dejar que tanstack-form corra su propia validación (que solo
  // dispara onSubmit si es válido), nos fijamos qué sección tiene el primer
  // error y la abrimos — si no, el usuario aprieta "Crear" y no pasa nada
  // visible porque el campo con error está en una sección colapsada.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()

    const result = propertyFormSchema.safeParse(form.state.values)
    const errored = new Set<string>()
    if (!result.success) {
      const paths = new Set(result.error.issues.map((i) => String(i.path[0])))
      if ([...paths].some((p) => BASIC_FIELDS.has(p))) errored.add('basic')
      if ([...paths].some((p) => LOCATION_FIELDS.has(p))) errored.add('location')
    }
    if (Object.values(attributeErrors).some(Boolean)) errored.add('features')
    setErroredSections(errored)

    if (errored.has('basic')) setOpenSection('basic')
    else if (errored.has('features')) setOpenSection('features')
    else if (errored.has('location')) setOpenSection('location')

    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
      <div className="pb-6">
        <Accordion value={openSection} onValueChange={setOpenSection}>
          <AccordionItem
            value="basic"
            icon={FileText}
            title="Información básica"
            description={basicPreview}
            hasError={erroredSections.has('basic')}
          >
            <form.Field name="title">
              {(field) => (
                <FormField field={field} label="Título" hint="Ejemplo: Casa en condominio La Colina.">
                  <Input
                    id={isEdit ? 'edit_title' : 'title'}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="off"
                  />
                </FormField>
              )}
            </form.Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <form.Field name="operation_type">
                {(field) => (
                  <FormField field={field} label="Operación">
                    <Select
                      value={field.state.value}
                      onValueChange={(v: 'sale' | 'rent' | 'lease') => field.handleChange(v)}
                      onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
                    >
                      <SelectTrigger id={isEdit ? 'edit_operation_type' : 'operation_type'}>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Venta</SelectItem>
                        <SelectItem value="rent">Alquiler</SelectItem>
                        <SelectItem value="lease">Arrendamiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>

              <form.Field name="category_id">
                {(field) => (
                  <FormField field={field} label="Categoría">
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                      onOpenChange={(isOpen) => { if (!isOpen) field.handleBlur() }}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger id={isEdit ? 'edit_category_id' : 'category_id'}>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <form.Field name="price">
                  {(field) => (
                    <FormField field={field} label="Precio" hint="Ejemplo: 125000000.">
                      <Input
                        id={isEdit ? 'edit_price' : 'price'}
                        type="number"
                        min={0}
                        step="any"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>

              <form.Field name="currency">
                {(field) => (
                  <FormField field={field} label="Moneda">
                    <Select
                      value={field.state.value}
                      onValueChange={(v: 'CRC' | 'USD') => field.handleChange(v)}
                    >
                      <SelectTrigger id={isEdit ? 'edit_currency' : 'currency'}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRC">₡ CRC</SelectItem>
                        <SelectItem value="USD">$ USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>
            </div>
          </AccordionItem>

          <AccordionItem
            value="features"
            icon={Home}
            title="Características de la propiedad"
            description={featuresPreview}
            hasError={erroredSections.has('features')}
          >
            {/* Atributos dinámicos según categoría */}
            <DynamicAttributeFields
              schema={selectedCategory?.attribute_schema}
              values={attributes ?? {}}
              onFieldChange={(key, val) => {
                const current = form.getFieldValue('attributes') ?? {}
                form.setFieldValue('attributes', { ...current, [key]: val })
              }}
              onFieldBlur={(_key) => {
                const current = form.getFieldValue('attributes') ?? {}
                form.setFieldValue('attributes', { ...current }, { dontValidate: true })
              }}
              errors={attributeErrors}
              isEdit={isEdit}
            />

            <div className="space-y-3 border-t border-hairline pt-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Amenidades</Label>
                <span className="text-[13px] font-body text-muted-foreground block">
                  Pre-marcadas según la categoría del bien. Desmarcá o agregá las
                  comodidades específicas de esta propiedad.
                </span>
              </div>
              {!categoryId ? (
                <p className="text-sm text-muted-foreground">
                  Seleccioná una categoría para ver sus amenidades.
                </p>
              ) : !selectedCategory?.amenities || selectedCategory.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta categoría no tiene amenidades asociadas todavía.{' '}
                  <span className="text-muted-foreground/80">
                    Se agregan desde Admin → Categorías.
                  </span>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.amenities.map((pa) => {
                    const id = pa.amenity_id
                    const checked = selectedAmenityIds.has(id)
                    return (
                      <label
                        key={id}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-hairline bg-surface-soft text-muted-foreground hover:text-foreground hover:bg-hairline/50'
                        }`}
                      >
                        <Checkbox
                          id={isEdit ? `edit_amenity_${id}` : `amenity_${id}`}
                          checked={checked}
                          onCheckedChange={() => toggleAmenity(id)}
                        />
                        <span>{pa.amenity.name}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </AccordionItem>

          <AccordionItem
            value="location"
            icon={MapPin}
            title="Ubicación en mapa"
            description={locationPreview}
            hasError={erroredSections.has('location')}
          >
            <form.Field name="address">
              {(field) => (
                <FormField field={field} label="Dirección" optional hint="Ejemplo: 200 m norte del parque central.">
                  <Input
                    id={isEdit ? 'edit_address' : 'address'}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    autoComplete="off"
                  />
                </FormField>
              )}
            </form.Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[13px] font-normal text-muted-foreground mb-1 block">Provincia</Label>
                <Select value={effectiveProvinceId} onValueChange={handleProvinceChange}>
                  <SelectTrigger id={isEdit ? 'edit_province' : 'province'}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sin selección</SelectItem>
                    {provinces?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[13px] font-normal text-muted-foreground mb-1 block">Cantón</Label>
                <Select value={effectiveCantonId} onValueChange={handleCantonChange} disabled={!effectiveProvinceId}>
                  <SelectTrigger id={isEdit ? 'edit_canton' : 'canton'}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sin selección</SelectItem>
                    {cantons?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[13px] font-normal text-muted-foreground mb-1 block">Distrito</Label>
                <Select
                  value={locationId || NONE_VALUE}
                  onValueChange={handleDistrictChange}
                  disabled={!effectiveCantonId}
                >
                  <SelectTrigger id={isEdit ? 'edit_district' : 'district'}>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Sin selección</SelectItem>
                    {districts?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(effectiveProvinceId || effectiveCantonId || locationId) && (
              <button
                type="button"
                onClick={clearLocation}
                className="text-[13px] font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Limpiar ubicación
              </button>
            )}

            {/* Coordenadas exactas — colapsadas por defecto, la mayoría no las necesita */}
            {showCoordinates ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <form.Field name="lat">
                  {(field) => (
                    <FormField field={field} label="Latitud" optional hint="Ejemplo: 9.9281.">
                      <Input
                        id={isEdit ? 'edit_lat' : 'lat'}
                        type="number"
                        step="any"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    </FormField>
                  )}
                </form.Field>

                <form.Field name="lng">
                  {(field) => (
                    <FormField field={field} label="Longitud" optional hint="Ejemplo: -84.0907.">
                      <Input
                        id={isEdit ? 'edit_lng' : 'lng'}
                        type="number"
                        step="any"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCoordinates(true)}
                className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Crosshair className="size-3.5" />
                Agregar coordenadas exactas (opcional)
              </button>
            )}
          </AccordionItem>

          <AccordionItem value="images" icon={Camera} title="Imágenes" description={imagesPreview}>
            <PropertyImagesField
              propertyId={isEdit && initialData ? initialData.id : undefined}
              files={queuedFiles}
              onChangeFiles={setQueuedFiles}
            />
          </AccordionItem>

          <AccordionItem value="settings" icon={Settings} title="Ajustes y Estado" description={settingsPreview}>
            {isEdit && (
              <FormField field={{ name: 'status', state: { meta: { isTouched: false, errors: [] } } }} label="Estado">
                <Select value={statusValue} onValueChange={(v) => setStatusValue(v as PropertyStatus)}>
                  <SelectTrigger id="edit_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}

            <form.Field name="description">
              {(field) => (
                <FormField field={field} label="Descripción" optional hint="Agregá detalles relevantes de la propiedad.">
                  <Textarea
                    id={isEdit ? 'edit_description' : 'description'}
                    rows={4}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="is_published">
              {(field) => (
                <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3">
                  <Switch
                    id={isEdit ? 'edit_is_published' : 'is_published'}
                    checked={field.state.value}
                    onCheckedChange={(v) => field.handleChange(v)}
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={isEdit ? 'edit_is_published' : 'is_published'} className="text-sm font-medium cursor-pointer">
                      Publicado
                    </Label>
                    <span className="text-[13px] font-body text-muted-foreground">
                      La propiedad será visible en el sitio web.
                    </span>
                  </div>
                </div>
              )}
            </form.Field>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Submit — mt-auto lo empuja al fondo cuando el contenido es corto
          (ej. crear, con el acordeón colapsado); sticky lo mantiene a la
          vista mientras se scrollea un form largo. Sin mt-auto, sticky solo
          actúa una vez hay overflow — con contenido corto no hay nada de qué
          "engancharse" y el botón queda flotando donde termina el acordeón,
          dejando el resto del panel vacío debajo. */}
      <div className="mt-auto sticky bottom-0 -mx-6 flex items-center gap-3 border-t border-hairline bg-canvas px-6 py-4">
        <Button type="submit" disabled={isPending || isUploadingImages} className="min-w-32">
          {(isPending || isUploadingImages) && <Loader2 className="size-4 animate-spin" />}
          {isUploadingImages ? 'Subiendo imágenes…' : isEdit ? 'Guardar cambios' : 'Crear propiedad'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isUploadingImages}
          onClick={() => {
            if (onCancel) onCancel()
            else navigate({ to: '/properties' })
          }}
          className="min-w-32"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

export { PropertyForm }
