import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Tags, Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/app/categories/hooks'
import type { Category, JSONSchema, JSONSchemaProperty } from '@/app/categories/types'

const categoryMetaSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  description: z.string().trim().max(500, 'Máximo 500 caracteres'),
})

// ─── Field builder types ──────────────────────────────────────────────────────

type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'array'

interface FieldDef {
  id: string
  key: string
  title: string
  type: FieldType
  required: boolean
  options: string[]       // enum values
  optionLabels: string[]  // enumNames (same length as options)
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  string: 'Texto',
  number: 'Número',
  integer: 'Entero',
  boolean: 'Sí / No',
  array: 'Lista múltiple',
}

// ─── Schema ↔ FieldDef conversion ────────────────────────────────────────────

function schemaToFields(schema: JSONSchema): FieldDef[] {
  const props = schema.properties ?? {}
  const required = new Set(schema.required ?? [])
  return Object.entries(props).map(([key, prop], i) => {
    const type: FieldType =
      prop.type === 'array' ? 'array'
        : prop.type === 'number' ? 'number'
        : prop.type === 'integer' ? 'integer'
        : prop.type === 'boolean' ? 'boolean'
        : 'string'
    const enumSrc = type === 'array' ? (prop.items?.enum ?? []) : (prop.enum ?? [])
    const enumNames = type === 'array'
      ? ((prop.items as JSONSchemaProperty & { enumNames?: string[] })?.enumNames ?? [])
      : ((prop as JSONSchemaProperty & { enumNames?: string[] }).enumNames ?? [])
    return {
      id: String(i),
      key,
      title: prop.title ?? key,
      type,
      required: required.has(key),
      options: enumSrc.map(String),
      optionLabels: enumNames.map(String),
    }
  })
}

function fieldsToSchema(fields: FieldDef[]): JSONSchema {
  const properties: Record<string, JSONSchemaProperty> = {}
  const required: string[] = []

  for (const f of fields) {
    if (!f.key.trim()) continue
    const hasOptions = f.options.length > 0
    let prop: JSONSchemaProperty & { enumNames?: string[] }

    if (f.type === 'array') {
      prop = {
        type: 'array',
        title: f.title || f.key,
        uniqueItems: true,
        items: hasOptions
          ? { type: 'string', enum: f.options, enumNames: f.optionLabels.length ? f.optionLabels : f.options }
          : { type: 'string' },
      }
    } else {
      prop = { type: f.type, title: f.title || f.key }
      if (hasOptions && (f.type === 'string' || f.type === 'integer')) {
        prop.enum = f.type === 'integer' ? f.options.map(Number) : f.options
        prop.enumNames = f.optionLabels.length ? f.optionLabels : f.options
      }
    }
    properties[f.key] = prop
    if (f.required) required.push(f.key)
  }

  return { $schema: 'http://json-schema.org/draft-07/schema#', type: 'object', required, properties }
}

function uid() {
  return Math.random().toString(36).slice(2)
}

function slugifyKey(v: string) {
  return v
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '')
}

function slugifyCat(v: string) {
  return v
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ─── Field row editor ─────────────────────────────────────────────────────────

interface FieldRowProps {
  field: FieldDef
  onChange: (f: FieldDef) => void
  onRemove: () => void
}

function FieldRow({ field, onChange, onRemove }: FieldRowProps) {
  const [optionsRaw, setOptionsRaw] = useState(field.options.join(', '))
  const [optionLabelsRaw, setOptionLabelsRaw] = useState(field.optionLabels.join(', '))
  const hasEnumSupport = field.type === 'string' || field.type === 'integer' || field.type === 'array'

  function applyOptions(raw: string, labels: string) {
    const opts = raw.split(',').map(s => s.trim()).filter(Boolean)
    const lbls = labels.split(',').map(s => s.trim()).filter(Boolean)
    onChange({ ...field, options: opts, optionLabels: lbls })
  }

  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4 space-y-4 relative">
      {/* Delete button absolutely positioned to avoid column alignment issues */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        aria-label="Eliminar campo"
      >
        <X className="size-4" />
      </button>

      <div className="flex gap-2">
        {/* Grip handle indicator */}
        <div className="flex items-start justify-center pt-2.5 shrink-0 select-none">
          <GripVertical className="size-4 text-muted-foreground/60 cursor-grab active:cursor-grabbing" />
        </div>

        <div className="flex-1 space-y-4 pr-6">
          {/* Main 2x2 Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-ink-body mb-1 block">Clave</label>
              <Input
                value={field.key}
                onChange={e => onChange({ ...field, key: slugifyKey(e.target.value) })}
                className="font-mono text-xs h-9 bg-canvas"
              />
              <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                Ejemplo: tipo_propiedad
              </span>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-ink-body mb-1 block">Etiqueta</label>
              <Input
                value={field.title}
                onChange={e => onChange({ ...field, title: e.target.value })}
                className="text-xs h-9 bg-canvas"
              />
              <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                Ejemplo: Tipo de propiedad
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-ink-body mb-1 block">Tipo</label>
              <Select
                value={field.type}
                onValueChange={v => onChange({ ...field, type: v as FieldType, options: [], optionLabels: [] })}
              >
                <SelectTrigger className="h-9 text-xs bg-canvas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{FIELD_TYPE_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-ink-body mb-1 block">
                Requerido <span className="text-[10px] text-muted-foreground font-normal">(click para cambiar)</span>
              </label>
              <button
                type="button"
                onClick={() => onChange({ ...field, required: !field.required })}
                className={[
                  'h-9 w-full rounded-md border text-xs font-medium transition-colors',
                  field.required
                    ? 'border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/8'
                    : 'border-hairline bg-surface-soft text-muted-foreground hover:text-foreground hover:bg-surface-strong/30',
                ].join(' ')}
              >
                {field.required ? 'Sí' : 'No'}
              </button>
            </div>
          </div>

          {/* Conditional Options & Labels Grid */}
          {hasEnumSupport && (
            <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-hairline-soft">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-ink-body mb-1 block">Opciones (separadas por coma)</label>
                <Input
                  value={optionsRaw}
                  onChange={e => { setOptionsRaw(e.target.value); applyOptions(e.target.value, optionLabelsRaw) }}
                  className="text-xs h-9 bg-canvas"
                />
                <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                  Ejemplo: casa, apartamento, lote
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-ink-body mb-1 block">Labels (separados por coma)</label>
                <Input
                  value={optionLabelsRaw}
                  onChange={e => { setOptionLabelsRaw(e.target.value); applyOptions(optionsRaw, e.target.value) }}
                  className="text-xs h-9 bg-canvas"
                />
                <span className="text-[11px] text-muted-foreground/80 mt-1 block">
                  Ejemplo: Casa, Apartamento, Lote
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Schema builder ───────────────────────────────────────────────────────────

function SchemaBuilder({ value, onChange }: { value: JSONSchema; onChange: (s: JSONSchema) => void }) {
  const [fields, setFields] = useState<FieldDef[]>(() => schemaToFields(value))
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function updateField(id: string, updated: FieldDef) {
    const next = fields.map(f => f.id === id ? updated : f)
    setFields(next)
    onChange(fieldsToSchema(next))
  }

  function removeField(id: string) {
    const next = fields.filter(f => f.id !== id)
    setFields(next)
    onChange(fieldsToSchema(next))
  }

  function addField() {
    const next = [...fields, { id: uid(), key: '', title: '', type: 'string' as FieldType, required: false, options: [], optionLabels: [] }]
    setFields(next)
    onChange(fieldsToSchema(next))
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(index: number, e: React.DragEvent) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const next = [...fields]
    const temp = next[draggedIndex]
    next.splice(draggedIndex, 1)
    next.splice(index, 0, temp)

    setDraggedIndex(index)
    setFields(next)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
    onChange(fieldsToSchema(fields))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Campos del formulario</label>
        <span className="text-xs text-muted-foreground">{fields.length} campo{fields.length !== 1 ? 's' : ''}</span>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline bg-surface-soft/50 py-6 text-center">
          <Text as="sm" className="text-muted-foreground">Sin campos. Agrega el primero.</Text>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {fields.map((f, index) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(index, e)}
              onDragEnd={handleDragEnd}
              className={`transition-opacity duration-200 ${draggedIndex === index ? 'opacity-45' : 'opacity-100'}`}
            >
              <FieldRow
                field={f}
                index={index}
                onChange={updated => updateField(f.id, updated)}
                onRemove={() => removeField(f.id)}
              />
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addField} className="w-full gap-1.5">
        <Plus className="size-3.5" />
        Agregar campo
      </Button>
    </div>
  )
}

// ─── Category card ────────────────────────────────────────────────────────────

function FieldPill({ name, prop, required }: { name: string; prop: JSONSchemaProperty; required: boolean }) {
  const label = prop.title ?? name
  const type = (Array.isArray(prop.type) ? prop.type[0] : prop.type) as FieldType | undefined
  const typeLabel = (type && FIELD_TYPE_LABEL[type]) ?? FIELD_TYPE_LABEL.string

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-soft px-3.5 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        {required && (
          <span className="shrink-0 text-caption font-medium text-badge-pink-strong">Requerido</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 text-caption text-muted-foreground">
        {prop.enum && (
          <>
            <span>{prop.enum.length} opciones</span>
            <span>·</span>
          </>
        )}
        <span>{typeLabel}</span>
      </div>
    </div>
  )
}

function CategoryCard({ category, onEdit, onDelete }: {
  category: Category
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  const props = category.attribute_schema.properties ?? {}
  const required = new Set(category.attribute_schema.required ?? [])
  const fieldCount = Object.keys(props).length

  return (
    <div className="rounded-xl border border-hairline bg-canvas shadow-soft overflow-hidden">
      <div className="px-6 py-5 border-b border-hairline flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-lg bg-surface-soft flex items-center justify-center shrink-0">
            <Tags className="size-5 text-ink-body" />
          </div>
          <div className="min-w-0">
            <Heading as="sm">{category.name}</Heading>
            {category.description && <Text as="sm" className="text-muted-foreground mt-0.5">{category.description}</Text>}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{category.slug}</span>
            <span>{fieldCount} campo{fieldCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 border-l border-hairline pl-3">
            <button onClick={() => onEdit(category)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-soft transition-colors">
              <Pencil className="size-4" />
            </button>
            <button onClick={() => onDelete(category)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <Text as="caption" className="text-muted-foreground uppercase tracking-wide font-semibold mb-3 block">Campos del formulario</Text>
        {fieldCount === 0 ? (
          <Text as="sm" className="text-muted-foreground">Sin campos definidos.</Text>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(props).map(([name, prop]) => (
              <FieldPill key={name} name={name} prop={prop} required={required.has(name)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create / Edit form ───────────────────────────────────────────────────────

type MetaValues = { name: string; slug: string; description: string }

function CategoryForm({ open, onOpenChange, editing }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Category | null
}) {
  const { mutate: create, isPending: creating } = useCreateCategory()
  const { mutate: update, isPending: updating } = useUpdateCategory()
  const isPending = creating || updating

  const [schema, setSchema] = useState<JSONSchema>(() =>
    editing ? editing.attribute_schema : { type: 'object', required: [], properties: {} }
  )

  const form = useForm({
    defaultValues: {
      name: editing?.name ?? '',
      slug: editing?.slug ?? '',
      description: editing?.description ?? '',
    } satisfies MetaValues,
    validators: { onSubmit: categoryMetaSchema },
    onSubmit: ({ value }: { value: MetaValues }) => {
      const payload = {
        name: value.name.trim(),
        slug: value.slug.trim(),
        description: value.description.trim() || undefined,
        attribute_schema: schema,
      }
      if (editing) {
        update({ id: editing.id, ...payload }, { onSuccess: () => { onOpenChange(false) } })
      } else {
        create(payload, { onSuccess: () => { onOpenChange(false) } })
      }
    },
  })

  function handleOpen(v: boolean) {
    onOpenChange(v)
    if (!v) {
      form.reset()
      setSchema(editing ? editing.attribute_schema : { type: 'object', required: [], properties: {} })
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={handleOpen}
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      description={editing ? 'Modifica nombre, slug y campos.' : 'Define el nombre y los campos del formulario.'}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitLabel={editing ? 'Guardar cambios' : 'Crear categoría'}
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" hint="Ejemplo: Bienes Raíces.">
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
                if (!editing) form.setFieldValue('slug', slugifyCat(e.target.value), { dontValidate: true })
              }}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="slug">
        {(field) => (
          <input
            type="hidden"
            id="slug"
            value={field.state.value}
          />
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField field={field} label="Descripción" optional hint="Resumen breve de la categoría.">
            <Input
              id="description"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>

      <SchemaBuilder
        key={editing?.id ?? 'new'}
        value={schema}
        onChange={setSchema}
      />
    </FormSheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function CategoriesAdminPage() {
  const { data: categories, isLoading } = useCategories()
  const { mutate: deleteCategory } = useDeleteCategory()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  function openCreate() { setEditing(null); setSheetOpen(true) }
  function openEdit(cat: Category) { setEditing(cat); setSheetOpen(true) }
  function handleDelete(cat: Category) {
    if (!confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) return
    deleteCategory(cat.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Categorías</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">Categorías de anuncios y sus esquemas de atributos.</Text>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map(i => <div key={i} className="rounded-2xl border border-hairline bg-canvas h-64 animate-pulse" />)}
        </div>
      ) : !categories?.length ? (
        <div className="rounded-2xl border border-hairline bg-canvas px-6 py-12 text-center">
          <Tags className="size-8 text-muted-foreground mx-auto mb-3" />
          <Text as="sm" className="text-muted-foreground">
            No hay categorías.{' '}
            <button onClick={openCreate} className="text-primary underline-offset-2 hover:underline">Crear la primera</button>
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {categories.map(cat => (
            <CategoryCard key={cat.id} category={cat} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CategoryForm key={editing?.id ?? 'new'} open={sheetOpen} onOpenChange={setSheetOpen} editing={editing} />
    </div>
  )
}

export default CategoriesAdminPage
