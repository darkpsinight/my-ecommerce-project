import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { disputeService, Dispute } from '@/services/disputeService'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const DisputeList = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDisputes = async () => {
            try {
                const response = await disputeService.listDisputes()
                setDisputes(response.data.disputes)
            } catch (error) {
                console.error('Failed to fetch disputes', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDisputes()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN':
                return 'default' // Primary
            case 'RESOLVED':
            case 'CLOSED':
            case 'WON':
            case 'LOST':
                return 'secondary'
            case 'NEEDS_RESPONSE':
                return 'destructive'
            default:
                return 'outline'
        }
    }

    if (loading) {
        return <div className="p-8">Loading disputes...</div>
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Disputes</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dispute Inbox</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dispute ID</TableHead>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {disputes.map((dispute) => (
                                <TableRow key={dispute.disputeId}>
                                    <TableCell className="font-medium">{dispute.disputeId}</TableCell>
                                    <TableCell>{dispute.orderPublicId || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusColor(dispute.status) as any}>
                                            {dispute.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(dispute.amount / 100).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: dispute.currency,
                                        })}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {dispute.reason}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(dispute.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild variant="ghost" size="sm">
                                            <Link to="/disputes/$disputeId" params={{ disputeId: dispute.disputeId }}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {disputes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">
                                        No disputes found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
