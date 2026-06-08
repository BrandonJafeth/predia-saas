import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Loader2 } from 'lucide-react'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import Text from '@/design-system/typography/text'

interface PaginationProps {
  page: number
  pageCount: number
  itemCount: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
}

interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[]
  data: TData[]
  isLoading?: boolean
  error?: boolean
  emptyMessage?: string
  emptyState?: React.ReactNode
  pagination?: PaginationProps
}

const DEFAULT_TH = 'text-left px-6 py-3 font-medium text-muted-foreground'

function DataTable<TData>({
  columns,
  data,
  isLoading,
  error,
  emptyMessage = 'No hay datos.',
  emptyState,
  pagination,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    enableSorting: false,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Text as="sm" className="text-destructive">
          Error al cargar los datos.
        </Text>
      </div>
    )
  }

  if (data.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>
    }
    return (
      <div className="flex items-center justify-center py-16">
        <Text as="sm" className="text-muted-foreground">
          {emptyMessage}
        </Text>
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-soft/40">
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
            {rows.map((row, i) => (
              <tr
                key={row.id}
                className={i !== rows.length - 1 ? 'border-b border-hairline' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-6 py-4${cell.column.columnDef.meta?.className ? ` ${cell.column.columnDef.meta.className}` : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && <PaginationControls {...pagination} />}
    </>
  )
}

export { DataTable }
export type { DataTableProps, PaginationProps }
