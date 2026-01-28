import { createFileRoute } from '@tanstack/react-router'
import { DisputeDetail } from '@/features/disputes/DisputeDetail'

export const Route = createFileRoute('/_authenticated/disputes/$disputeId')({
    component: DisputeDetail,
})
