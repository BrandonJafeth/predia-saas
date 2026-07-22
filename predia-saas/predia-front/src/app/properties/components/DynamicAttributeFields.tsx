import { memo, useMemo, useState } from 'react'
import { Input } from '@/design-system/ui/input'
import { Switch } from '@/design-system/ui/switch'
import { Label } from '@/design-system/ui/label'
import { Text } from '@/design-system/typography'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { FormField } from '@/shared/components/form-field'
import type { JSONSchema } from '@/app/categories/types'

interface DynamicAttributeFieldsProps {
  schema: JSONSchema | undefined
  values: Record<string, string>
  onFieldChange: (key: string, value: string) => void
  onFieldBlur: (key: string) => void
  errors: Record<string, string | undefined>
  isEdit: boolean
}

interface FieldLike {
  name: string
  state: {
    meta: {
      isTouched: boolean
      errors: ReadonlyArray<unknown>
    }
  }
}

function DynamicAttributeFields({
  schema,
  values,
  onFieldChange,
  onFieldBlur,
  errors,
  isEdit,
}: DynamicAttributeFieldsProps) {
  const properties = schema?.properties
  const requiredSet = useMemo(
    () => new Set(schema?.required ?? []),
    [schema?.required],
  )
  const [touchedFields, setTouchedFields] = useState(() => new Set<string>())

  function markTouched(key: string) {
    setTouchedFields((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }

  if (!properties || Object.keys(properties).length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline bg-surface-soft/50 px-4 py-6 text-center">
        <Text as="sm" className="text-muted-foreground">
          Esta categoría no tiene campos adicionales.
        </Text>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1 sm:col-span-2 border-t border-hairline pt-4">
        <Text as="sm" className="font-semibold text-foreground">
          Atributos específicos
        </Text>
        <Text as="caption" className="text-muted-foreground block mb-2">
          Completá los detalles según el tipo de propiedad.
        </Text>
      </div>

      {Object.entries(properties).map(([key, prop]) => {
        const types = Array.isArray(prop.type) ? prop.type : [prop.type]
        const primaryType = types[0]
        const isRequired = requiredSet.has(key)
        const label = prop.title ?? key
        const value = values[key] ?? ''
        const error = errors[key]

        function handleBlur() {
          markTouched(key)
          onFieldBlur(key)
        }

        function makeFieldLike(): FieldLike {
          return {
            name: `attr_${key}`,
            state: {
              meta: {
                isTouched: touchedFields.has(key),
                errors: error ? [error] : [],
              },
            },
          }
        }

        if (primaryType === 'boolean') {
          return (
            <div key={key} className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-hairline bg-surface-soft px-4 py-3">
              <Switch
                id={isEdit ? `edit_attr_${key}` : `attr_${key}`}
                checked={value === 'true'}
                onCheckedChange={(v) => {
                  onFieldChange(key, v ? 'true' : 'false')
                  handleBlur()
                }}
              />
              <div className="flex flex-col">
                <Label
                  htmlFor={isEdit ? `edit_attr_${key}` : `attr_${key}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {label}
                  {isRequired && <span className="ml-1 text-destructive">*</span>}
                </Label>
              </div>
            </div>
          )
        }

        if (primaryType === 'array' && prop.items?.enum && prop.items.enum.length > 0) {
          const enumValues = prop.items.enum.map(String)
          const enumLabels = (prop.items.enumNames ?? []).map(String)
          const selectedSet = new Set(value.split(',').filter(Boolean))

          function toggleArrayItem(item: string) {
            const next = new Set(selectedSet)
            if (next.has(item)) {
              next.delete(item)
            } else {
              next.add(item)
            }
            onFieldChange(key, Array.from(next).join(','))
          }

          return (
            <div key={key} className="sm:col-span-2 rounded-xl border border-hairline p-4 space-y-3">
              <Label className="text-sm font-medium cursor-pointer">
                {label}
                {isRequired && <span className="ml-1 text-destructive">*</span>}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {enumValues.map((val, i) => {
                  const checked = selectedSet.has(val)
                  const id = `${isEdit ? 'edit_' : ''}attr_${key}_${val}`
                  return (
                    <Label
                      key={val}
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
                        onChange={() => { toggleArrayItem(val); handleBlur() }}
                        className="sr-only"
                      />
                      <span className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-primary border-primary' : 'border-hairline bg-canvas'
                      }`}>
                        {checked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      {enumLabels[i] ?? val}
                    </Label>
                  )
                })}
              </div>
            </div>
          )
        }

        if ((primaryType === 'string' || primaryType === 'number' || primaryType === 'integer') && prop.enum && prop.enum.length > 0) {
          const enumValues = prop.enum.map(String)
          const enumLabels = (prop.enumNames ?? []).map(String)
          return (
            <AttributeFormField
              key={key}
              fieldLike={makeFieldLike()}
              label={label}
              required={isRequired}
            >
              <Select
                value={value}
                onValueChange={(v) => {
                  onFieldChange(key, v === '__none__' ? '' : v)
                  handleBlur()
                }}
                onOpenChange={(open) => { if (!open) handleBlur() }}
              >
                <SelectTrigger id={isEdit ? `edit_attr_${key}` : `attr_${key}`}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin selección</SelectItem>
                  {enumValues.map((val, i) => (
                    <SelectItem key={val} value={val}>
                      {enumLabels[i] ?? val}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AttributeFormField>
          )
        }

        if (primaryType === 'number' || primaryType === 'integer') {
          return (
            <AttributeFormField
              key={key}
              fieldLike={makeFieldLike()}
              label={label}
              required={isRequired}
            >
              <Input
                id={isEdit ? `edit_attr_${key}` : `attr_${key}`}
                type="number"
                min={prop.minimum}
                max={prop.maximum}
                step={primaryType === 'integer' ? 1 : 'any'}
                value={value}
                onChange={(e) => onFieldChange(key, e.target.value)}
                onBlur={handleBlur}
              />
            </AttributeFormField>
          )
        }

        return (
          <AttributeFormField
            key={key}
            fieldLike={makeFieldLike()}
            label={label}
            required={isRequired}
            hint={prop.maxLength ? `Máximo ${prop.maxLength} caracteres` : undefined}
          >
            <Input
              id={isEdit ? `edit_attr_${key}` : `attr_${key}`}
              type="text"
              maxLength={prop.maxLength}
              value={value}
              onChange={(e) => onFieldChange(key, e.target.value)}
              onBlur={handleBlur}
              autoComplete="off"
            />
          </AttributeFormField>
        )
      })}
    </div>
  )
}

interface AttributeFormFieldProps {
  fieldLike: FieldLike
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function AttributeFormField({ fieldLike, label, required, hint, children }: AttributeFormFieldProps) {
  return (
    <FormField
      field={fieldLike}
      label={`${label}${required ? ' *' : ''}`}
      required={required}
      optional={!required}
      hint={hint}
    >
      {children}
    </FormField>
  )
}

const MemoizedDynamicAttributeFields = memo(DynamicAttributeFields)

export { MemoizedDynamicAttributeFields as DynamicAttributeFields }
