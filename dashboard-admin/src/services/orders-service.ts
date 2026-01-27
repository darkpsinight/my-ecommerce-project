import { ADMIN_API, ApiResponse } from '@/config/api'
import { Order } from '@/features/orders/data/schema'
import { apiClient } from '@/lib/api-client'

interface GetOrdersParams {
    page?: number
    limit?: number
    status?: string
    escrowStatus?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    signal?: AbortSignal
}

interface OrdersResponse {
    orders: Order[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

class OrdersService {
    private static instance: OrdersService

    private constructor() { }

    public static getInstance(): OrdersService {
        if (!OrdersService.instance) {
            OrdersService.instance = new OrdersService()
        }
        return OrdersService.instance
    }

    async getOrders(params: GetOrdersParams): Promise<OrdersResponse> {
        try {
            const { signal, ...queryParams } = params
            const response = await apiClient.get<ApiResponse<OrdersResponse>>(ADMIN_API.ORDERS, {
                params: queryParams,
                signal
            })
            if (!response.data.data) {
                throw new Error('No data received')
            }
            return response.data.data
        } catch (error) {
            console.error('getOrders error:', error)
            throw error
        }
    }

    async releaseEscrow(orderId: string): Promise<void> {
        await apiClient.post(
            `${ADMIN_API.ORDERS}/${orderId}/escrow/release`,
            {}
        )
    }

    async refundEscrow(orderId: string, reason: string): Promise<void> {
        await apiClient.post(
            `${ADMIN_API.ORDERS}/${orderId}/escrow/refund`,
            { reason }
        )
    }
}

export const ordersService = OrdersService.getInstance()
