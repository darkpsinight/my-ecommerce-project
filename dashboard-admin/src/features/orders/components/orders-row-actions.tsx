import { useState } from 'react'
import { MoreHorizontal, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
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
} from '@/components/ui/alert-dialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Order } from '../data/schema'
import { ordersService } from '@/services/orders-service'
import { useOrders } from '../orders-context'

interface DataTableRowActionsProps {
    row: { original: Order }
}

interface RefundError {
    success: boolean;
    errorCode: string;
    message: string;
    source: string;
    orderExternalId: string;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
    const order = row.original
    const { refresh } = useOrders()
    const [releaseOpen, setReleaseOpen] = useState(false)
    const [refundOpen, setRefundOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Error State
    const [errorOpen, setErrorOpen] = useState(false)
    const [errorData, setErrorData] = useState<RefundError | null>(null)

    const handleRelease = async () => {
        try {
            setIsLoading(true)
            await ordersService.releaseEscrow(order.externalId)
            toast.success('Escrow released successfully')
            refresh()
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
            refresh()
            setRefundOpen(false)
        } catch (error: any) {
            console.error(error);
            const data = error?.response?.data;

            // Check for structured error from Backend
            if (data && data.success === false && data.errorCode) {
                setErrorData(data);
                setRefundOpen(false); // Close confirmation
                setErrorOpen(true);   // Open error details
                toast.error('Refund failed — see details', { duration: 3000 });
            } else {
                toast.error('Failed to refund escrow');
            }
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

            {/* PERSISTENT ERROR DIALOG */}
            <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            <DialogTitle>Refund Failed</DialogTitle>
                        </div>
                        <DialogDescription>
                            The refund could not be processed due to an external error.
                        </DialogDescription>
                    </DialogHeader>

                    {errorData && (
                        <div className="grid gap-4 py-4">
                            {/* Special Clean Message for Missing Stripe Intent */}
                            {errorData.source === 'stripe' && errorData.errorCode === 'resource_missing' ? (
                                <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive-foreground">
                                    <p className="font-semibold">Critical State Error</p>
                                    <p className="mt-1">
                                        This order references a non-existent Stripe PaymentIntent.
                                        Automatic refund is not possible because the upstream transaction record is missing.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-md bg-muted p-3 text-sm">
                                    <p className="font-mono text-xs text-muted-foreground">REASON</p>
                                    <p className="mb-2 font-medium break-all">{errorData.message}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Source:</span>
                                    <span className="col-span-2 uppercase font-mono">{errorData.source}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Error Code:</span>
                                    <span className="col-span-2 font-mono break-all">{errorData.errorCode}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <span className="font-medium text-muted-foreground">Order ID:</span>
                                    <span className="col-span-2 font-mono text-xs">{errorData.orderExternalId}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setErrorOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
