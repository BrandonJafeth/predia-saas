import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
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
import { Label } from '@/design-system/ui/label'
import { Button } from '@/design-system/ui/button'
import { FormField } from '@/shared/components/form-field'
import { useCreateProperty, useUpdateProperty } from '../hooks'
import { useCategories } from '@/app/categories/hooks'
import { useProvinces, useLocationsTree, useLocationChildren } from '@/app/locations/hooks'
import { propertyFormSchema } from '../types/create-property.schema'
import { DynamicAttributeFields } from './DynamicAttributeFields'
import { validateAttributes } from '../utils/build-attributes-schema'
import type { Property, CreatePropertyRequest } from '../types'
import { extractApiError } from '@/shared/lib/notifications'

const NONE_VALUE = '__none__'

interface PropertyFormProps {
  initialData?: Property
  onSuccess?: () => void
  onCancel?: () => void
}

function PropertyForm({ initialData, onSuccess, onCancel }: PropertyFormProps) {
  const isEdit = !!initialData
  const navigate = useNavigate()

  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { mutate: createProperty, isPending: isCreating } = useCreateProperty()
  const { mutate: updateProperty, isPending: isUpdating } = useUpdateProperty()
  const isPending = isCreating || isUpdating

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
          { id: initialData.id, ...payload },
          {
            onSuccess: () => {
              form.reset()
              if (onSuccess) onSuccess()
              else navigate({ to: '/properties' })
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
          onSuccess: () => {
            form.reset()
            if (onSuccess) onSuccess()
            else navigate({ to: '/properties' })
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

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  )

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Título */}
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

      {/* Tipo de operación + Categoría */}
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

      {/* Precio + Moneda */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <form.Field name="price">
            {(field) => (
              <FormField field={field} label="Precio" hint="Ingresá solo números. Ejemplo: 125000000.">
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

      {/* Dirección */}
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

      {/* Latitud + Longitud */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Ubicación jerárquica */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Ubicación</Label>
          <span className="text-[13px] font-body text-muted-foreground">(opcional)</span>
        </div>
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
      </div>

      {/* Descripción */}
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

      {/* Publicado toggle */}
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

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear propiedad'}
        </Button>
        <Button
          type="button"
          variant="outline"
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
