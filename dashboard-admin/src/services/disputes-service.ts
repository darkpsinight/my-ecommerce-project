import { ADMIN_API, ApiResponse } from '@/config/api'
import { apiClient } from '@/lib/api-client'

export interface Dispute {
    _id: string
    disputeId: string
    orderId: string
    externalId: string
    sellerId: string
    buyerId: string
    amount: number // in cents
    currency: string
    status: string
    reason: string
    createdAt: string
    updatedAt: string
}

interface GetDisputesParams {
    page?: number
    limit?: number
    status?: string // Backend supports it, though UI might not initially
    orderId?: string
    signal?: AbortSignal
}

interface DisputesResponse {
    disputes: Dispute[]
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

class DisputesService {
    private static instance: DisputesService

    private constructor() { }

    public static getInstance(): DisputesService {
        if (!DisputesService.instance) {
            DisputesService.instance = new DisputesService()
        }
        return DisputesService.instance
    }

    async getDisputes(params: GetDisputesParams): Promise<DisputesResponse> {
        try {
            const { signal, ...queryParams } = params
            // Ensure defaults
            const finalParams = {
                page: 1,
                limit: 20,
                ...queryParams
            }

            // Backend returns standard envelope: { success: true, data: { disputes: ... } }
            const response = await apiClient.get<ApiResponse<DisputesResponse>>(ADMIN_API.DISPUTES, {
                params: finalParams,
                signal
            })

            // Verify response structure
            console.log('[DisputesService] Raw API Response:', response);

            // Access data from envelope
            // response.data is ApiResponse (axios body)
            // response.data.data is DisputesResponse (payload)
            const apiResponse = response.data;
            const disputesData = apiResponse.data;

            if (!apiResponse.success || !disputesData) {
                console.warn('[DisputesService] Invalid or unsuccessful response:', apiResponse);
                return {
                    disputes: [],
                    pagination: { page: 1, limit: 20, total: 0, pages: 0 }
                }
            }

            console.log('[DisputesService] Returning data:', disputesData);
            return disputesData
        } catch (error) {
            console.error('getDisputes error:', error)
            throw error
        }
    }
}

export const disputesService = DisputesService.getInstance()
