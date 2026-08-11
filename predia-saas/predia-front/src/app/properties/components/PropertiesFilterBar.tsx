import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/design-system/ui/button'
import { Input } from '@/design-system/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { useLocationsTree, useLocationChildren, useProvinces } from '@/app/locations/hooks'
import { OPERATION_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '../constants'
import type { OperationType, PropertyStatus } from '../types'

type FilterablePropertyStatus = Exclude<PropertyStatus, 'archived'>

const FILTER_TRIGGER_CLASS = 'w-auto min-w-36 h-9 rounded-lg border-hairline bg-canvas text-sm'

const ALL_VALUE = '__all__'

interface PropertiesFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  operation: OperationType | undefined
  onOperationChange: (v: OperationType | undefined) => void
  status: FilterablePropertyStatus | undefined
  onStatusChange: (v: FilterablePropertyStatus | undefined) => void
  locationId: string | undefined
  onLocationIdChange: (v: string | undefined) => void
}

function PropertiesFilterBar({
  search,
  onSearchChange,
  operation,
  onOperationChange,
  status,
  onStatusChange,
  locationId,
  onLocationIdChange,
}: PropertiesFilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(search)
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setSearchDraft(search)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== search) onSearchChange(searchDraft)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  // Picker jerárquico de ubicación (Provincia → Cantón → Distrito). El backend
  // filtra por location_id exacto (normalmente un distrito), así que los dos
  // primeros niveles solo guían hasta el distrito.
  const [uiProvinceId, setUiProvinceId] = useState('')
  const [uiCantonId, setUiCantonId] = useState('')
  const { data: locationTree } = useLocationsTree()
  const { data: provinces } = useProvinces()

  // React Compiler handles memoization here; a manual useMemo is not preserved.
  function deriveLocation() {
    if (!locationId || !locationTree) return null
    for (const province of locationTree) {
      for (const canton of province.children ?? []) {
        if (canton.children?.some((d) => d.id === locationId)) {
          return { provinceId: province.id, cantonId: canton.id }
        }
      }
    }
    return null
  }
  const derivedLocation = deriveLocation()

  const effectiveProvinceId = derivedLocation?.provinceId ?? uiProvinceId
  const effectiveCantonId = derivedLocation?.cantonId ?? uiCantonId
  const { data: cantons } = useLocationChildren(effectiveProvinceId || null)
  const { data: districts } = useLocationChildren(effectiveCantonId || null)

  function handleProvinceChange(id: string) {
    if (id === ALL_VALUE) {
      setUiProvinceId('')
      setUiCantonId('')
      onLocationIdChange(undefined)
      return
    }
    setUiProvinceId(id)
    setUiCantonId('')
    onLocationIdChange(undefined)
  }

  function handleCantonChange(id: string) {
    if (id === ALL_VALUE) {
      setUiCantonId('')
      onLocationIdChange(undefined)
      return
    }
    setUiCantonId(id)
    onLocationIdChange(undefined)
  }

  function handleDistrictChange(id: string) {
    if (id === ALL_VALUE) {
      onLocationIdChange(undefined)
      return
    }
    onLocationIdChange(id)
  }

  const hasActiveFilters =
    !!search ||
    operation !== undefined ||
    status !== undefined ||
    locationId !== undefined

  function clearFilters() {
    setSearchDraft('')
    onSearchChange('')
    onOperationChange(undefined)
    onStatusChange(undefined)
    onLocationIdChange(undefined)
    setUiProvinceId('')
    setUiCantonId('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Buscar por título o dirección..."
          className="h-9 w-full rounded-lg border-hairline bg-canvas pl-9 text-sm"
        />
      </div>

      <Select
        value={operation ?? ALL_VALUE}
        onValueChange={(v) => onOperationChange(v === ALL_VALUE ? undefined : (v as OperationType))}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Operación" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todas las operaciones</SelectItem>
          {OPERATION_FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status ?? ALL_VALUE}
        onValueChange={(v) => onStatusChange(v === ALL_VALUE ? undefined : (v as FilterablePropertyStatus))}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los estados</SelectItem>
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={effectiveProvinceId || ALL_VALUE}
        onValueChange={handleProvinceChange}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Provincia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todas las provincias</SelectItem>
          {provinces?.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={effectiveCantonId || ALL_VALUE}
        onValueChange={handleCantonChange}
        disabled={!effectiveProvinceId}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Cantón" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los cantones</SelectItem>
          {cantons?.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={locationId ?? ALL_VALUE}
        onValueChange={handleDistrictChange}
        disabled={!effectiveCantonId}
      >
        <SelectTrigger className={FILTER_TRIGGER_CLASS}>
          <SelectValue placeholder="Distrito" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>Todos los distritos</SelectItem>
          {districts?.map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="default"
          size="sm"
          onClick={clearFilters}
          className="text-ink-muted text-white hover:text-white text-xs h-9 px-3"
        >
          Limpiar
        </Button>
      )}
    </div>
  )
}

export default PropertiesFilterBar
