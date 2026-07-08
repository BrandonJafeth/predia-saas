import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
    headerClassName?: string
    filterVariant?: 'text' | 'select'
    filterOptions?: { label: string; value: string }[]
  }
}
