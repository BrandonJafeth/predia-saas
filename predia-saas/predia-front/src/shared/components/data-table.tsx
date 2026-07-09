import { useEffect, useState } from 'react'
import {
  type ColumnFiltersState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
  type Table as ReactTableInstance,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from 'lucide-react'
import Text from '@/design-system/typography/text'
import { Checkbox } from '@/design-system/ui/checkbox'
import { Input } from '@/design-system/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/design-system/ui/select'
import { Skeleton } from '@/design-system/ui/skeleton'
import { cn } from '@/shared/lib/utils'

const ALL_VALUES_OPTION = '__all__'

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
  data: TData[]
  isLoading?: boolean
  error?: boolean
  emptyMessage?: string
  emptyState?: React.ReactNode
  getRowId?: (row: TData) => string
  skeletonRowCount?: number

  // Sorting — pasar sorting+onSortingChange para modo controlado (server-side).
  // Solo enableSorting habilita sorting 100% client-side sobre `data`.
  enableSorting?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void

  // Filtrado global (barra de búsqueda en el toolbar)
  enableGlobalFilter?: boolean
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  globalFilterPlaceholder?: string

  // Filtrado por columna — columnas con meta.filterVariant muestran un control en el toolbar
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void

  // Selección de filas + acciones en bulk
  enableRowSelection?: boolean
  resetSelectionKeys?: unknown[]
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode
}

const DEFAULT_TH = 'text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground'
const SKELETON_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-1/3', 'w-4/5']

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="size-3.5" />
  if (direction === 'desc') return <ArrowDown className="size-3.5" />
  return <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
}

function ColumnFilterControl<TData>({ table }: { table: ReactTableInstance<TData> }) {
  const filterableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.columnDef.meta?.filterVariant === 'select')

  if (filterableColumns.length === 0) return null

  return (
    <>
      {filterableColumns.map((column) => {
        const options = column.columnDef.meta?.filterOptions ?? []
        const value = (column.getFilterValue() as string | undefined) ?? ALL_VALUES_OPTION
        return (
          <Select
            key={column.id}
            value={value}
            onValueChange={(v) => column.setFilterValue(v === ALL_VALUES_OPTION ? undefined : v)}
          >
            <SelectTrigger className="w-auto min-w-[10rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUES_OPTION}>Todos</SelectItem>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}
    </>
  )
}

function DataTable<TData>({
  columns,
  data,
  isLoading,
  error,
  emptyMessage = 'No hay datos.',
  emptyState,
  getRowId,
  skeletonRowCount = 5,
  enableSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  enableGlobalFilter = false,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  globalFilterPlaceholder = 'Buscar...',
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  enableRowSelection = false,
  resetSelectionKeys,
  bulkActions,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([])
  const [internalGlobalFilter, setInternalGlobalFilter] = useState('')
  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [searchDraft, setSearchDraft] = useState(controlledGlobalFilter ?? '')

  const sortingState = controlledSorting ?? internalSorting
  const globalFilterState = controlledGlobalFilter ?? internalGlobalFilter
  const columnFiltersState = controlledColumnFilters ?? internalColumnFilters
  const manualSorting = !!onSortingChange
  const manualFiltering = !!onColumnFiltersChange || !!onGlobalFilterChange

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === 'function' ? updater(sortingState) : updater
    onSortingChange?.(next)
    if (!controlledSorting) setInternalSorting(next)
  }

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === 'function' ? updater(columnFiltersState) : updater
    onColumnFiltersChange?.(next)
    if (!controlledColumnFilters) setInternalColumnFilters(next)
  }

  useEffect(() => {
    setSearchDraft(controlledGlobalFilter ?? '')
  }, [controlledGlobalFilter])

  useEffect(() => {
    const timer = setTimeout(() => {
      onGlobalFilterChange?.(searchDraft)
      if (!controlledGlobalFilter) setInternalGlobalFilter(searchDraft)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  useEffect(() => {
    setRowSelection({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetSelectionKeys ?? [])

  const table = useReactTable({
    data,
    columns,
    getRowId,
    enableSorting,
    enableRowSelection,
    manualSorting,
    manualFiltering,
    state: {
      sorting: sortingState,
      globalFilter: globalFilterState,
      columnFilters: columnFiltersState,
      rowSelection,
    },
    onSortingChange: handleSortingChange,
    onGlobalFilterChange: (v) => {
      onGlobalFilterChange?.(v as string)
      if (!controlledGlobalFilter) setInternalGlobalFilter(v as string)
    },
    onColumnFiltersChange: handleColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    enableMultiSort: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const hasToolbar =
    enableGlobalFilter || table.getAllLeafColumns().some((c) => !!c.columnDef.meta?.filterVariant)
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original)
  const clearSelection = () => table.resetRowSelection()

  return (
    <div className="space-y-3">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {enableGlobalFilter && (
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder={globalFilterPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          <ColumnFilterControl table={table} />
        </div>
      )}

      {enableRowSelection && bulkActions && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-soft px-4 py-2.5">
          <Text as="sm" className="font-medium">
            {selectedRows.length} seleccionado{selectedRows.length === 1 ? '' : 's'}
          </Text>
          <div className="flex items-center gap-2">{bulkActions(selectedRows, clearSelection)}</div>
        </div>
      )}

      {isLoading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-[#F7F7F8]">
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName ?? DEFAULT_TH}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex !== skeletonRowCount - 1 ? 'border-b border-hairline' : ''}
                >
                  {table.getFlatHeaders().map((header, colIndex) => (
                    <td key={header.id} className="px-6 py-5 align-middle">
                      <Skeleton className={cn('h-4', SKELETON_WIDTHS[colIndex % SKELETON_WIDTHS.length])} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <Text as="sm" className="text-destructive">
            Error al cargar los datos.
          </Text>
        </div>
      ) : data.length === 0 ? (
        emptyState ? (
          <>{emptyState}</>
        ) : (
          <div className="flex items-center justify-center py-16">
            <Text as="sm" className="text-muted-foreground">
              {emptyMessage}
            </Text>
          </div>
        )
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-[#F7F7F8]">
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName ?? DEFAULT_TH}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex select-none items-center gap-1.5"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i, rows) => (
                <tr
                  key={row.id}
                  className={cn(
                    'transition-colors hover:bg-[#F7F7F8]/70',
                    i !== rows.length - 1 && 'border-b border-hairline',
                    row.getIsSelected() && 'bg-primary/5',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-6 py-5 align-middle',
                        cell.column.columnDef.meta?.className,
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function createSelectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    meta: { headerClassName: 'w-10 px-4 py-4', className: 'w-10 px-4' },
  }
}

export { DataTable, createSelectionColumn }
export type { DataTableProps }
