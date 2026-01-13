import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Order } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './orders-row-actions'

export const ordersColumns: ColumnDef<Order>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label='Select all'
                className='translate-y-[2px]'
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label='Select row'
                className='translate-y-[2px]'
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'externalId',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Order ID' />
        ),
        cell: ({ row }) => <div className='w-[80px] truncate' title={row.getValue('externalId')}>{row.getValue('externalId')}</div>,
        enableSorting: true,
        enableHiding: false,
    },
    {
        id: 'buyer',
        accessorFn: (row) => row.buyerId,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Buyer (UID)' />
        ),
        cell: ({ row }) => {
            const uid = row.original.buyerId
            return (
                <div className='flex flex-col'>
                    <span className='font-mono text-xs truncate w-[100px]' title={uid}>{uid}</span>
                </div>
            )
        },
    },
    {
        id: 'seller',
        accessorFn: (row) => row.sellerId,
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Seller (UID)' />
        ),
        cell: ({ row }) => {
            const uid = row.original.sellerId
            return (
                <div className='flex flex-col'>
                    <span className='font-mono text-xs truncate w-[100px]' title={uid}>{uid}</span>
                </div>
            )
        },
    },
    {
        accessorKey: 'totalAmount',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Amount' />
        ),
        cell: ({ row }) => {
            const amount = row.original.totalAmount
            const formatted = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: row.original.currency || 'USD',
            }).format(amount)

            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Status' />
        ),
        cell: ({ row }) => {
            const val = row.getValue('status') as string;
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
            if (val === 'completed') variant = 'default'; // Or green if possible via class
            if (val === 'failed') variant = 'destructive';
            if (val === 'pending') variant = 'secondary';
            return <Badge variant={variant}>{val}</Badge>
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'escrowStatus',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Escrow' />
        ),
        cell: ({ row }) => {
            const val = row.getValue('escrowStatus') as string;
            if (!val) return <span className="text-muted-foreground text-xs text-center">-</span>;

            let className = "";
            if (val === 'held') className = "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/20";
            if (val === 'released') className = "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 border-green-500/20";
            if (val === 'refunded') className = "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 border-red-500/20";

            return <Badge variant="outline" className={className}>{val}</Badge>
        },
        filterFn: (row, id, value) => {
            return value.includes(row.getValue(id))
        },
    },
    {
        accessorKey: 'createdAt',
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title='Date' />
        ),
        cell: ({ row }) => {
            return <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => <DataTableRowActions row={row} />,
    },
]
