import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { disputesService, DisputeDetailResponse } from '@/services/disputes-service'
import { formatCurrency } from '@/utils/format'
import { DisputeStatusBadge } from './DisputeStatusBadge'

interface DisputeDetailProps {
    disputeId: string
}

export function DisputeDetail({ disputeId }: DisputeDetailProps) {
    const navigate = useNavigate()
    const [data, setData] = useState<DisputeDetailResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchDetail = async () => {
            if (!disputeId) return
            setLoading(true)
            try {
                const result = await disputesService.getDisputeDetail(disputeId)
                if (result) {
                    setData(result)
                } else {
                    setError('Dispute not found')
                }
            } catch (err) {
                console.error(err)
                setError('Failed to load dispute details')
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [disputeId])

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-xl font-semibold">{error || 'Dispute not found'}</p>
            <Button onClick={() => navigate({ to: '/disputes' })}>Back to Disputes</Button>
        </div>
    )

    const { dispute, orderSnapshot, timeline } = data

    return (
        <div className='flex min-h-screen flex-col'>
            <Header fixed>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/disputes' })}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-semibold">Dispute Details</h1>
                </div>
            </Header>
            <Main>
                <div className="space-y-6 max-w-5xl mx-auto py-6">
                    {/* Header Section */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">{dispute.disputeId}</h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>Opened {new Date(dispute.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className="font-mono text-sm">Order #{dispute.orderPublicId}</span>
                            </div>
                        </div>
                        <DisputeStatusBadge status={dispute.status} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Summary Panel */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Dispute Context</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Reason:</span>
                                    <span className="font-medium">{dispute.reason}</span>

                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-medium">{formatCurrency(dispute.amount / 100, dispute.currency)}</span>

                                    <span className="text-muted-foreground">Buyer ID:</span>
                                    <span className="font-mono text-xs truncate" title={dispute.buyerId}>{dispute.buyerId}</span>

                                    <span className="text-muted-foreground">Seller ID:</span>
                                    <span className="font-mono text-xs truncate" title={dispute.sellerId}>{dispute.sellerId}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Escrow Snapshot Panel */}
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center">
                                    Escrow Snapshot
                                    {orderSnapshot?.escrowStatus === 'held' && (
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                            Frozen
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {orderSnapshot ? (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-muted-foreground">Order ID:</span>
                                        <span className="font-mono text-xs">{orderSnapshot.orderPublicId}</span>

                                        <span className="text-muted-foreground">Order Total:</span>
                                        <span className="font-medium">{formatCurrency(orderSnapshot.totalAmount, orderSnapshot.currency)}</span>

                                        <span className="text-muted-foreground">Escrow Status:</span>
                                        <span className="font-mono uppercase">{orderSnapshot.escrowStatus}</span>

                                        <span className="text-muted-foreground">Held At:</span>
                                        <span>{orderSnapshot.escrowHeldAt ? new Date(orderSnapshot.escrowHeldAt).toLocaleString() : '—'}</span>

                                        <span className="text-muted-foreground">Hold Starts:</span>
                                        <span>{orderSnapshot.holdStartAt ? new Date(orderSnapshot.holdStartAt).toLocaleDateString() : '—'}</span>

                                        <div className="col-span-2 pt-2 text-xs text-muted-foreground italic">
                                            * Funds are currently frozen due to active dispute.
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">Order data unavailable.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l border-muted ml-3 space-y-8 pb-8">
                                {timeline.map((event, index) => (
                                    <div key={event.id || index} className="relative flex items-start pl-6 group">
                                        {/* Dot */}
                                        <div className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-background ${event.actor === 'SYSTEM' ? 'bg-gray-400' : 'bg-blue-500'
                                            }`} />

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium leading-none">
                                                    {event.action.replace(/_/g, ' ')}
                                                </p>
                                                <time className="text-xs text-muted-foreground">
                                                    {new Date(event.timestamp).toLocaleString()}
                                                </time>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {event.message}
                                            </p>
                                            <div className="flex items-center pt-1">
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {event.actor}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {timeline.length === 0 && (
                                    <p className="pl-6 text-muted-foreground text-sm">No events recorded.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </div>
    )
}
