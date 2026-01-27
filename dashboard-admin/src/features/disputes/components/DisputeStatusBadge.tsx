import { Badge } from '@/components/ui/badge'

interface DisputeStatusBadgeProps {
    status: string
}

export function DisputeStatusBadge({ status }: DisputeStatusBadgeProps) {
    // As per plan, raw status text only.
    // We can add basic variants if needed, but for now we keep it neutral/default
    // or use outline to distinguish it.

    const getVariant = (status: string) => {
        switch (status) {
            case 'OPEN':
            case 'UNDER_REVIEW':
                return 'destructive'
            case 'RESOLVED':
                return 'secondary'
            case 'CLOSED':
                return 'outline'
            default:
                return 'default'
        }
    }

    return (
        <Badge variant={getVariant(status)} className="font-mono text-xs">
            {status}
        </Badge>
    )
}
