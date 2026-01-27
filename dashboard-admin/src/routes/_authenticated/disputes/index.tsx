import { createFileRoute } from '@tanstack/react-router'
import DisputesPage from '@/features/disputes'

export const Route = createFileRoute('/_authenticated/disputes/')({
    component: DisputesPage,
})
