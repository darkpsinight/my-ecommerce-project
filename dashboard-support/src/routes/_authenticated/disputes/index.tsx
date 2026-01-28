import { createFileRoute } from '@tanstack/react-router'
import { DisputeList } from '@/features/disputes/DisputeList'

export const Route = createFileRoute('/_authenticated/disputes/')({
    component: DisputeList,
})
