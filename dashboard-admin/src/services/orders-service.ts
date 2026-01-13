import axios from 'axios'
import { ADMIN_API, ApiResponse } from '@/config/api'
import { Order } from '@/features/orders/data/schema'
import { getCookie } from '@/lib/cookies'

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
    private readonly TOKEN_KEY = 'admin_auth_token'

    private constructor() { }

    public static getInstance(): OrdersService {
        if (!OrdersService.instance) {
            OrdersService.instance = new OrdersService()
        }
        return OrdersService.instance
    }

    private getAuthHeader() {
        let token = getCookie(this.TOKEN_KEY)

        // Sanitize token: remove leading/trailing quotes
        if (token) {
            token = token.replace(/^"+|"+$/g, '')
        }

        return token ? { Authorization: `Bearer ${token}` } : {}
    }

    async getOrders(params: GetOrdersParams): Promise<OrdersResponse> {
        try {
            const { signal, ...queryParams } = params
            const response = await axios.get<ApiResponse<OrdersResponse>>(ADMIN_API.ORDERS, {
                params: queryParams,
                withCredentials: true,
                headers: this.getAuthHeader(),
                signal
            })
            if (!response.data.data) {
                throw new Error('No data received')
            }
            return response.data.data
        } catch (error) {
            // Don't log if cancelled
            if (axios.isCancel(error)) {
                throw error
            }
            console.error('getOrders error:', error)
            throw error
        }
    }

    async releaseEscrow(orderId: string): Promise<void> {
        await axios.post(
            `${ADMIN_API.ORDERS}/${orderId}/escrow/release`,
            {},
            {
                withCredentials: true,
                headers: this.getAuthHeader()
            }
        )
    }

    async refundEscrow(orderId: string, reason: string): Promise<void> {
        await axios.post(
            `${ADMIN_API.ORDERS}/${orderId}/escrow/refund`,
            { reason },
            {
                withCredentials: true,
                headers: this.getAuthHeader()
            }
        )
    }
}

export const ordersService = OrdersService.getInstance()
