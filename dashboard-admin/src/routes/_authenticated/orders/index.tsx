import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Orders } from '@/features/orders'
import { statuses, escrowStatuses } from '@/features/orders/data/data'

const statusValues = statuses.map((s) => s.value) as [string, ...string[]]
const escrowStatusValues = escrowStatuses.map((s) => s.value) as [string, ...string[]]

const orderSearchSchema = z.object({
    page: z.number().optional().catch(1),
    pageSize: z.number().optional().catch(10),
    status: z
        .array(z.enum(statusValues))
        .optional()
        .catch([]),
    escrowStatus: z
        .array(z.enum(escrowStatusValues))
        .optional()
        .catch([]),
    search: z.string().optional().catch(''),
    sort: z.string().optional().catch('createdAt'), // Default sort
    order: z.enum(['asc', 'desc']).optional().catch('desc'),
})

export const Route = createFileRoute('/_authenticated/orders/')({
    validateSearch: orderSearchSchema,
    component: Orders,
})
