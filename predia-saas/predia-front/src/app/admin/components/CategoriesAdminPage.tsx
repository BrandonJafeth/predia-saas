import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Tags, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import { Textarea } from '@/design-system/ui/textarea'
import { FormSheet } from '@/design-system/ui/form-sheet'
import { FormField } from '@/shared/components/form-field'
import Heading from '@/design-system/typography/heading'
import Text from '@/design-system/typography/text'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/app/categories/hooks'
import type { Category, JSONSchema, JSONSchemaProperty } from '@/app/categories/types'

const BLANK_SCHEMA = JSON.stringify({ type: 'object', required: [], properties: {} }, null, 2)

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseSchema(raw: string): JSONSchema | null {
  try {
    return JSON.parse(raw) as JSONSchema
  } catch {
    return null
  }
}

function FieldPill({ name, prop, required }: { name: string; prop: JSONSchemaProperty; required: boolean }) {
  const label = prop.title ?? name
  const type = Array.isArray(prop.type) ? prop.type.join('|') : (prop.type ?? '?')
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-soft px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        {required && (
          <span className="shrink-0 text-[10px] font-semibold text-destructive uppercase tracking-wide">req</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {prop.enum && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0">
            {prop.enum.length} opciones
          </Badge>
        )}
        {prop.type === 'array' && (
          <Badge variant="violet" className="text-[10px] px-1.5 py-0">array</Badge>
        )}
        <span className="font-mono text-[10px] text-muted-foreground">{type}</span>
      </div>
    </div>
  )
}

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  const props = category.attribute_schema.properties ?? {}
  const required = new Set(category.attribute_schema.required ?? [])
  const fieldCount = Object.keys(props).length

  return (
    <div className="rounded-2xl border border-hairline bg-canvas shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-hairline flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Tags className="size-5 text-primary" />
          </div>
          <div>
            <Heading as="sm">{category.name}</Heading>
            {category.description && (
              <Text as="sm" className="text-muted-foreground mt-0.5">{category.description}</Text>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-xs text-muted-foreground bg-surface-soft border border-hairline rounded-md px-2 py-1">
            {category.slug}
          </span>
          <Badge variant="default">{fieldCount} campos</Badge>
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-soft transition-colors"
            title="Editar"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        <Text as="caption" className="text-muted-foreground uppercase tracking-wide font-semibold mb-3 block">
          Campos del formulario
        </Text>
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

      <div className="px-6 py-3 border-t border-hairline bg-surface-soft/40 flex items-center justify-between">
        <Text as="caption" className="text-muted-foreground">
          Actualizado {new Date(category.updated_at).toLocaleDateString('es-CR', { dateStyle: 'medium' })}
        </Text>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{required.size} requeridos</span>
          <ChevronRight className="size-3" />
          <span>{fieldCount - required.size} opcionales</span>
        </div>
      </div>
    </div>
  )
}

type FormValues = { name: string; slug: string; description: string; attribute_schema: string }

function CategoryForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Category | null
}) {
  const { mutate: create, isPending: creating } = useCreateCategory()
  const { mutate: update, isPending: updating } = useUpdateCategory()
  const isPending = creating || updating

  const form = useForm({
    defaultValues: {
      name: editing?.name ?? '',
      slug: editing?.slug ?? '',
      description: editing?.description ?? '',
      attribute_schema: editing
        ? JSON.stringify(editing.attribute_schema, null, 2)
        : BLANK_SCHEMA,
    } satisfies FormValues,
    onSubmit: ({ value }: { value: FormValues }) => {
      const parsed = parseSchema(value.attribute_schema)
      if (!parsed) return

      if (editing) {
        update(
          { id: editing.id, name: value.name, slug: value.slug, description: value.description || undefined, attribute_schema: parsed },
          { onSuccess: () => { onOpenChange(false); form.reset() } },
        )
      } else {
        create(
          { name: value.name, slug: value.slug, description: value.description || undefined, attribute_schema: parsed },
          { onSuccess: () => { onOpenChange(false); form.reset() } },
        )
      }
    },
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={(v) => { onOpenChange(v); if (!v) form.reset() }}
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      description={editing ? 'Modifica los datos de la categoría.' : 'Define el nombre, slug y atributos.'}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      submitLabel={editing ? 'Guardar cambios' : 'Crear categoría'}
    >
      <form.Field name="name">
        {(field) => (
          <FormField field={field} label="Nombre" required>
            <Input
              id="name"
              placeholder="Ej. Bienes Raíces"
              value={field.state.value}
              onChange={(e) => {
                field.handleChange(e.target.value)
                if (!editing) {
                  form.setFieldValue('slug', slugify(e.target.value), { dontValidate: true })
                }
              }}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="slug">
        {(field) => (
          <FormField field={field} label="Slug" required>
            <Input
              id="slug"
              placeholder="bienes-raices"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="font-mono text-sm"
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FormField field={field} label="Descripción">
            <Input
              id="description"
              placeholder="Opcional"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="attribute_schema">
        {(field) => {
          const isInvalidJson = field.state.meta.isTouched && !parseSchema(field.state.value)
          return (
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none">
                Attribute Schema <span className="text-destructive">*</span>
              </label>
              <Textarea
                id="attribute_schema"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                rows={14}
                className="font-mono text-xs resize-none"
                placeholder={BLANK_SCHEMA}
              />
              {isInvalidJson && (
                <p className="text-[13px] font-medium text-destructive">JSON inválido</p>
              )}
              <p className="text-[11px] text-muted-foreground">JSON Schema Draft-07</p>
            </div>
          )
        }}
      </form.Field>
    </FormSheet>
  )
}

function CategoriesAdminPage() {
  const { data: categories, isLoading } = useCategories()
  const { mutate: deleteCategory } = useDeleteCategory()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setSheetOpen(true)
  }

  function handleDelete(cat: Category) {
    if (!confirm(`¿Eliminar "${cat.name}"? Esta acción no se puede deshacer.`)) return
    deleteCategory(cat.id)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading as="lg">Categorías</Heading>
          <Text as="sm" className="text-muted-foreground mt-1">
            Categorías de anuncios y sus esquemas de atributos.
          </Text>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto gap-2">
          <Plus className="size-4" />
          Nueva categoría
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-hairline bg-canvas h-64 animate-pulse" />
          ))}
        </div>
      ) : !categories?.length ? (
        <div className="rounded-2xl border border-hairline bg-canvas px-6 py-12 text-center">
          <Tags className="size-8 text-muted-foreground mx-auto mb-3" />
          <Text as="sm" className="text-muted-foreground">
            No hay categorías.{' '}
            <button onClick={openCreate} className="text-primary underline-offset-2 hover:underline">
              Crear la primera
            </button>
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CategoryForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
      />
    </div>
  )
}

export default CategoriesAdminPage
