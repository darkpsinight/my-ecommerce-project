import { z } from 'zod'

export const orderSchema = z.object({
    _id: z.string(),
    externalId: z.string(),
    buyerId: z.string().optional(),
    sellerId: z.string().optional(),
    totalAmount: z.number(),
    currency: z.string(),
    status: z.string(),
    escrowStatus: z.string().optional(),
    createdAt: z.string(),
})

export type Order = z.infer<typeof orderSchema>
