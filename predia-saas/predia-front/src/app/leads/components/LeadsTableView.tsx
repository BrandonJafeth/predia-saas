import { createColumnHelper, type SortingState } from '@tanstack/react-table'
import { Loader2, MoreHorizontal, PencilLine, Archive, Eye } from 'lucide-react'
import { Badge } from '@/design-system/ui/badge'
import { Button } from '@/design-system/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/design-system/ui/dropdown-menu'
import { DataTable, createSelectionColumn } from '@/shared/components/data-table'
import { PaginationControls } from '@/design-system/ui/pagination-controls'
import { SOURCE_LABEL, SOURCE_VARIANT, STATUS_LABEL, STATUS_VARIANT } from '@/app/leads/constants'
import type { Lead } from '@/app/leads/types'

const colHelper = createColumnHelper<Lead>()

function createColumns(
  agentNameById: Map<string, string>,
  onView: (lead: Lead) => void,
  onEdit: (lead: Lead) => void,
  onArchive: (lead: Lead) => void,
  isMobile: boolean,
) {
  const actionsColumn = colHelper.display({
    id: 'actions',
    enableSorting: false,
    header: () => null,
    cell: (info) => {
      const lead = info.row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onView(lead)}>
              <Eye />
              <span>Ver detalle</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onEdit(lead)}>
              <PencilLine />
              <span>Editar</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onArchive(lead)}>
              <Archive />
              <span>Archivar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  })

  const nameColumn = colHelper.accessor('name', {
    header: 'Nombre',
    cell: (info) => (
      <button
        type="button"
        onClick={() => onView(info.row.original)}
        className="font-medium hover:underline text-left"
      >
        {info.getValue()}
      </button>
    ),
  })

  const statusColumn = colHelper.accessor('status', {
    header: 'Estado',
    cell: (info) => {
      const status = info.getValue()
      return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
    },
  })

  const agentColumn = colHelper.accessor('assigned_to', {
    header: 'Agente',
    enableSorting: false,
    cell: (info) => {
      const id = info.getValue()
      return (
        <span className="text-muted-foreground">
          {id ? agentNameById.get(id) ?? 'Agente desconocido' : 'Sin asignar'}
        </span>
      )
    },
  })

  // En móvil se muestra una tabla simplificada: nombre, estado, agente y acciones.
  if (isMobile) {
    return [nameColumn, statusColumn, agentColumn, actionsColumn]
  }

  return [
    createSelectionColumn<Lead>(),
    nameColumn,
    colHelper.accessor('email', {
      header: 'Email',
      enableSorting: false,
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('phone', {
      header: 'Teléfono',
      enableSorting: false,
      cell: (info) => <span className="text-muted-foreground">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('source', {
      header: 'Fuente',
      cell: (info) => {
        const source = info.getValue()
        return <Badge variant={SOURCE_VARIANT[source]}>{SOURCE_LABEL[source]}</Badge>
      },
    }),
    statusColumn,
    agentColumn,
    colHelper.accessor('created_at', {
      header: 'Creado',
      cell: (info) => new Date(info.getValue()).toLocaleDateString('es-CR'),
      meta: { className: 'text-muted-foreground' },
    }),
    actionsColumn,
  ]
}

interface LeadsTableViewProps {
  leads: Lead[]
  isLoading?: boolean
  error?: boolean
  agentNameById: Map<string, string>
  isMobile: boolean
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  page: number
  pageCount?: number
  itemCount?: number
  limit: number
  onPageChange: (page: number) => void
  onView: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onArchive: (lead: Lead) => void
  bulkArchiving: boolean
  onBulkArchive: (rows: Lead[], clearSelection: () => void) => void
  resetSelectionKeys: unknown[]
}

function LeadsTableView({
  leads,
  isLoading,
  error,
  agentNameById,
  isMobile,
  sorting,
  onSortingChange,
  page,
  pageCount,
  itemCount,
  limit,
  onPageChange,
  onView,
  onEdit,
  onArchive,
  bulkArchiving,
  onBulkArchive,
  resetSelectionKeys,
}: LeadsTableViewProps) {
  const columns = createColumns(agentNameById, onView, onEdit, onArchive, isMobile)

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft">
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoading}
          error={error}
          emptyMessage="No hay leads todavía."
          getRowId={(row) => row.id}
          enableSorting
          sorting={sorting}
          onSortingChange={onSortingChange}
          enableRowSelection={!isMobile}
          resetSelectionKeys={resetSelectionKeys}
          bulkActions={(rows, clearSelection) => (
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkArchiving}
              onClick={() => onBulkArchive(rows, clearSelection)}
            >
              {bulkArchiving && <Loader2 className="size-4 animate-spin" />}
              Archivar seleccionados
            </Button>
          )}
        />
      </div>

      {pageCount !== undefined && itemCount !== undefined && (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          itemCount={itemCount}
          limit={limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}

export default LeadsTableView
