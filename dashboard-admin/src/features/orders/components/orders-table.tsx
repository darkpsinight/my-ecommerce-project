import { useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Order } from '../data/schema'
import { ordersColumns as columns } from './orders-columns'
import { DataTableToolbar } from './data-table-toolbar'
import { DataTablePagination } from '@/features/tasks/components/data-table-pagination'

const route = getRouteApi('/_authenticated/orders/')

interface OrdersTableProps {
    data: Order[]
    total: number
    loading: boolean
}

export function OrdersTable({ data, total, loading }: OrdersTableProps) {
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    const navigate = route.useNavigate()
    const search = route.useSearch()

    // Handle sorting URL sync manually
    const sorting: SortingState = [
        {
            id: search.sort || 'createdAt',
            desc: search.order === 'desc',
        },
    ]

    const onSortingChange: import('@tanstack/react-table').OnChangeFn<SortingState> =
        (updater) => {
            const next = typeof updater === 'function' ? updater(sorting) : updater
            const sortItem = next[0]
            navigate({
                search: (prev) => ({
                    ...prev,
                    sort: sortItem ? sortItem.id : undefined,
                    order: sortItem ? (sortItem.desc ? 'desc' : 'asc') : undefined,
                }),
            })
        }

    const {
        pagination,
        onPaginationChange,
        globalFilter,
        onGlobalFilterChange,
        columnFilters,
        onColumnFiltersChange,
    } = useTableUrlState({
        search: route.useSearch(),
        navigate: route.useNavigate(),
        pagination: { defaultPage: 1, defaultPageSize: 10 },
        globalFilter: { enabled: true, key: 'search' },
        columnFilters: [
            { columnId: 'status', searchKey: 'status', type: 'array' },
            { columnId: 'escrowStatus', searchKey: 'escrowStatus', type: 'array' },
        ],
    })

    // Calculate pageCount based on total items
    const pageCount = Math.ceil(total / pagination.pageSize)

    const table = useReactTable({
        data,
        columns,
        pageCount: pageCount > 0 ? pageCount : 1,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            globalFilter,
            pagination: {
                pageIndex: pagination.pageIndex,
                pageSize: pagination.pageSize,
            },
        },
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: onSortingChange,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: onPaginationChange,
        onGlobalFilterChange: onGlobalFilterChange,
        onColumnFiltersChange: onColumnFiltersChange,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    })

    return (
        <div className='space-y-4'>
            <DataTableToolbar table={table} />
            <div className='rounded-md border'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'
                                >
                                    Loading orders...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    )
}
