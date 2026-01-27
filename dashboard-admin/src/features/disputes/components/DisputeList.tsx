import { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dispute, disputesService } from '@/services/disputes-service'
import { DisputeStatusBadge } from './DisputeStatusBadge'
import { formatCurrency } from '../../../utils/format'
import { Loader2 } from 'lucide-react'

export function DisputeList() {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [limit] = useState(20)
    const [pages, setPages] = useState(0)

    useEffect(() => {
        const fetchDisputes = async () => {
            setLoading(true)
            try {
                console.log('[DisputeList] Fetching disputes...');
                const data = await disputesService.getDisputes({ page, limit })
                console.log('[DisputeList] Received data:', data);
                console.log('[DisputeList] Setting disputes:', data.disputes);
                setDisputes(data.disputes)
                setPages(data.pagination.pages)
            } catch (error) {
                console.error('Failed to fetch disputes', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDisputes()
    }, [page, limit])

    const handleNext = () => {
        if (page < pages) setPage((p) => p + 1)
    }

    const handlePrev = () => {
        if (page > 1) setPage((p) => p - 1)
    }

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dispute ID</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disputes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No disputes found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    disputes.map((dispute) => (
                                        <TableRow key={dispute.disputeId}>
                                            <TableCell className="font-medium font-mono text-xs">{dispute.disputeId}</TableCell>
                                            <TableCell className="font-mono text-xs">{dispute.orderId}</TableCell>
                                            <TableCell>{dispute.reason}</TableCell>
                                            <TableCell>
                                                {/* Amount is in cents */}
                                                {formatCurrency(dispute.amount / 100, dispute.currency)}
                                            </TableCell>
                                            <TableCell>
                                                <DisputeStatusBadge status={dispute.status} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(dispute.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={page <= 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {pages || 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={page >= pages}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
