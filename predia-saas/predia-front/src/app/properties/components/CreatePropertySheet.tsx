import { useForm } from '@tanstack/react-form'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { useCreateProperty } from '../hooks'
import { useCategories } from '@/app/categories/hooks'
import { createPropertySchema } from '../types/create-property.schema'
import type { CreatePropertyRequest } from '../types'

interface CreatePropertySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function CreatePropertySheet({ open, onOpenChange }: CreatePropertySheetProps) {
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories()
  const { mutate: createProperty, isPending } = useCreateProperty()

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      price: '',
      operation_type: '' as string,
      currency: 'CRC' as 'CRC' | 'USD',
      category_id: '',
      subtype: '',
      lot_area_m2: '',
      built_area_m2: '',
      address: '',
    },
    validators: { onSubmit: createPropertySchema },
    onSubmit: ({ value }) => {
      // TanStack Form passes raw form state (strings), not Zod-transformed output.
      // Build a typed payload manually so the backend receives the correct types.
      const payload: CreatePropertyRequest = {
        title: value.title.trim(),
        price: Number(value.price),
        operation_type: value.operation_type as 'sale' | 'rent' | 'lease',
        currency: value.currency,
        category_id: value.category_id,
        ...(value.description.trim() ? { description: value.description.trim() } : {}),
        ...(value.subtype.trim() ? { subtype: value.subtype.trim() } : {}),
        ...(value.lot_area_m2 ? { lot_area_m2: Number(value.lot_area_m2) } : {}),
        ...(value.built_area_m2 ? { built_area_m2: Number(value.built_area_m2) } : {}),
        ...(value.address.trim() ? { address: value.address.trim() } : {}),
        is_published: false,
      }
      createProperty(payload, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
        },
      })
    },
  })

  function handleSubmit(e: { preventDefault(): void; stopPropagation(): void }) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  const categories = categoriesData ?? []

  return (
    <FormSheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
      title="Nueva propiedad"
      description="Completá los datos básicos para crear la propiedad."
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitLabel="Crear propiedad"
    >
      {/* Título */}
      <form.Field name="title">
        {(field) => (
          <FormField field={field} label="Título" hint="Ejemplo: Casa en condominio La Colina.">
            <Input
              id="title"
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
                onValueChange={(v: 'sale' | 'rent' | 'lease') =>
                  field.handleChange(v)
                }
                onOpenChange={(isOpen) => {
                  if (!isOpen) field.handleBlur()
                }}
              >
                <SelectTrigger id="operation_type">
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
                onOpenChange={(isOpen) => {
                  if (!isOpen) field.handleBlur()
                }}
                disabled={categoriesLoading}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
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
                  id="price"
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
                <SelectTrigger id="currency">
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

      {/* Subtipo */}
      <form.Field name="subtype">
        {(field) => (
          <FormField field={field} label="Subtipo" optional hint="Ejemplo: Casa, apartamento o local.">
            <Input
              id="subtype"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoComplete="off"
            />
          </FormField>
        )}
      </form.Field>

      {/* Área */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <form.Field name="lot_area_m2">
          {(field) => (
            <FormField field={field} label="Área lote (m²)" optional hint="Ingresá solo números. Ejemplo: 350.">
              <Input
                id="lot_area_m2"
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

        <form.Field name="built_area_m2">
          {(field) => (
            <FormField field={field} label="Área construida (m²)" optional hint="Ingresá solo números. Ejemplo: 180.">
              <Input
                id="built_area_m2"
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

      {/* Dirección */}
      <form.Field name="address">
        {(field) => (
          <FormField field={field} label="Dirección" optional hint="Ejemplo: 200 m norte del parque central.">
            <Input
              id="address"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              autoComplete="off"
            />
          </FormField>
        )}
      </form.Field>

      {/* Descripción */}
      <form.Field name="description">
        {(field) => (
          <FormField field={field} label="Descripción" optional hint="Agregá detalles relevantes de la propiedad.">
            <Textarea
              id="description"
              rows={4}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>
    </FormSheet>
  )
}

export { CreatePropertySheet }
