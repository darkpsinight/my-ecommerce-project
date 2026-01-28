import { useEffect, useState } from 'react'
import { disputeService, DisputeDetail as IDisputeDetail } from '@/services/disputeService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Route } from '@/routes/_authenticated/disputes/$disputeId'

export const DisputeDetail = () => {
    const { disputeId } = Route.useParams()

    const [dispute, setDispute] = useState<IDisputeDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [justification, setJustification] = useState('')
    const [extendDays, setExtendDays] = useState(3)
    const [actionLoading, setActionLoading] = useState(false)
    const [actionType, setActionType] = useState<'RELEASE' | 'REFUND' | 'EXTEND' | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (!disputeId) return
        const fetchDispute = async () => {
            try {
                const response = await disputeService.getDispute(disputeId)
                setDispute(response.data.dispute)
            } catch (error) {
                console.error('Failed to fetch dispute', error)
                toast.error('Failed to load dispute details')
            } finally {
                setLoading(false)
            }
        }
        fetchDispute()
    }, [disputeId])

    const handleAction = async () => {
        if (!dispute || !actionType) return
        if (!justification) {
            toast.error('Justification is required')
            return
        }

        setActionLoading(true)
        try {
            if (actionType === 'RELEASE') {
                await disputeService.releaseEscrow(dispute.disputeId, justification)
                toast.success('Escrow released to seller')
            } else if (actionType === 'REFUND') {
                await disputeService.refundToWallet(dispute.disputeId, justification)
                toast.success('Refunded to buyer wallet')
            } else if (actionType === 'EXTEND') {
                await disputeService.extendDispute(dispute.disputeId, extendDays, justification)
                toast.success(`Dispute extended by ${extendDays} days`)
            }
            // Refresh
            const response = await disputeService.getDispute(dispute.disputeId)
            setDispute(response.data.dispute)
            setIsDialogOpen(false)
            setJustification('')
            setActionType(null)
        } catch (error: any) {
            console.error('Action failed', error)
            toast.error(error.response?.data?.message || 'Action failed')
        } finally {
            setActionLoading(false)
        }
    }

    const openActionDialog = (type: 'RELEASE' | 'REFUND' | 'EXTEND') => {
        setActionType(type)
        setJustification('')
        setIsDialogOpen(true)
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!dispute) return <div className="p-8">Dispute not found</div>

    const isOpen = dispute.status === 'OPEN'

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dispute {dispute.disputeId}</h1>
                    <p className="text-muted-foreground mt-1">
                        Order Public ID: <span className="font-mono">{dispute.orderPublicId}</span>
                    </p>
                </div>
                <Badge className="text-lg px-4 py-1" variant={dispute.status === 'OPEN' ? 'default' : 'secondary'}>
                    {dispute.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Details & Chat */}
                <div className="md:col-span-2 space-y-6">
                    {/* Order Snapshot */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Amount Held</Label>
                                <div className="text-xl font-bold">
                                    {(dispute.amount / 100).toLocaleString('en-US', { style: 'currency', currency: dispute.currency })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Original Order Total</Label>
                                <div className="text-lg">
                                    {(dispute.orderSnapshot?.totalAmount / 100).toLocaleString('en-US', { style: 'currency', currency: dispute.currency })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Escrow Status</Label>
                                <div>{dispute.orderSnapshot?.escrowStatus}</div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Created At</Label>
                                <div>{new Date(dispute.createdAt).toLocaleString()}</div>
                            </div>
                            <div className="col-span-2">
                                <Label className="text-muted-foreground">Reason</Label>
                                <p className="mt-1 text-sm bg-muted p-3 rounded-md">{dispute.reason}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chat History (Read Only) */}
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Dispute Chat (Read-Only)</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
                            {!dispute.messages || dispute.messages.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10">No messages found or not loaded.</div>
                            ) : (
                                dispute.messages.map((msg: any, idx: number) => (
                                    <div key={idx} className={`flex flex-col ${msg.senderRole === 'ADMIN' ? 'items-center' : msg.senderRole === 'BUYER' ? 'items-start' : 'items-end'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.senderRole === 'ADMIN' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-muted'}`}>
                                            <div className="text-xs font-bold mb-1">{msg.senderRole} ({msg.senderId})</div>
                                            <div>{msg.messageBody}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resolution Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {!isOpen && (
                                <div className="p-3 bg-muted rounded-md text-center text-sm text-muted-foreground">
                                    Dispute is {dispute.status.toLowerCase()}. Actions are disabled.
                                </div>
                            )}

                            <Button
                                className="w-full"
                                variant="default"
                                disabled={!isOpen}
                                onClick={() => openActionDialog('RELEASE')}
                            >
                                Release to Seller
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Seller wins. Funds released to Seller Ledger.
                            </p>

                            <Separator />

                            <Button
                                className="w-full"
                                variant="destructive"
                                disabled={!isOpen}
                                onClick={() => openActionDialog('REFUND')}
                            >
                                Refund to Wallet
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Buyer wins. Funds credited to Buyer Wallet.
                            </p>

                            <Separator />

                            <Button
                                className="w-full"
                                variant="outline"
                                disabled={!isOpen}
                                onClick={() => openActionDialog('EXTEND')}
                            >
                                Extend Hold
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Evidence Deadline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dispute.evidenceDueBy ? new Date(dispute.evidenceDueBy).toLocaleDateString() : 'None Set'}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Action Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'RELEASE' && 'Release Escrow to Seller'}
                            {actionType === 'REFUND' && 'Refund to Buyer Wallet'}
                            {actionType === 'EXTEND' && 'Extend Dispute Hold'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'RELEASE' && 'This will release the held funds to the seller\'s ledger. This action is irreversible and closes the dispute.'}
                            {actionType === 'REFUND' && 'This will credit the buyer\'s wallet with the full order amount. No funds will be returned to the original payment method. This action is irreversible.'}
                            {actionType === 'EXTEND' && 'Extends the evidence due date.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionType === 'EXTEND' && (
                            <div className="space-y-2">
                                <Label>Days to Extend</Label>
                                <Input type="number" min={1} value={extendDays} onChange={(e) => setExtendDays(parseInt(e.target.value))} />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Justification (Required)</Label>
                            <Textarea
                                placeholder="Enter reason for this action..."
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant={actionType === 'REFUND' ? 'destructive' : 'default'}
                            onClick={handleAction}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Processing...' : 'Confirm Action'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
