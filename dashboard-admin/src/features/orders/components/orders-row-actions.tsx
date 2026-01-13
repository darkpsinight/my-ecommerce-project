import { useState } from 'react'
import { MoreHorizontal, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is used, if not I'll check.
// Checking imports in other files... tasks-table imported icons.
// I'll stick to lucide-react.

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog' // Assuming these exist

import { Order } from '../data/schema'
import { ordersService } from '@/services/orders-service'

import { useOrders } from '../orders-context'

interface DataTableRowActionsProps {
    row: { original: Order }
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
    const order = row.original
    const { refresh } = useOrders()
    const [releaseOpen, setReleaseOpen] = useState(false)
    const [refundOpen, setRefundOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleRelease = async () => {
        try {
            setIsLoading(true)
            await ordersService.releaseEscrow(order.externalId)
            toast.success('Escrow released successfully')
            refresh() // Trigger table refresh
            setReleaseOpen(false)
        } catch (error) {
            console.error(error);
            toast.error('Failed to release escrow')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRefund = async () => {
        try {
            setIsLoading(true)
            await ordersService.refundEscrow(order.externalId, 'Admin initiated refund')
            toast.success('Escrow refunded successfully')
            refresh() // Trigger table refresh
            setRefundOpen(false)
        } catch (error) {
            console.error(error);
            toast.error('Failed to refund escrow')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Open menu</span>
                        <MoreHorizontal className='size-4' />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(order.externalId)}
                    >
                        Copy order ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    {order.escrowStatus === 'held' && (
                        <>
                            <DropdownMenuItem onClick={() => setReleaseOpen(true)}>
                                <ShieldCheck className='mr-2 size-4' />
                                Release Escrow
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRefundOpen(true)}>
                                <ShieldAlert className='mr-2 size-4 text-red-500' />
                                <span className='text-red-500'>Refund Escrow</span>
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={releaseOpen} onOpenChange={setReleaseOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Release Escrow?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will release the funds to the seller. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleRelease() }} disabled={isLoading}>
                            {isLoading ? 'Releasing...' : 'Release Funds'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={refundOpen} onOpenChange={setRefundOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Refund Escrow?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will refund the payment to the buyer. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleRefund() }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Refunding...' : 'Refund Order'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
