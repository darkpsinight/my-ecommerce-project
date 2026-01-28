import { apiClient } from '@/lib/api-client'

export interface Dispute {
    _id: string
    disputeId: string
    orderPublicId: string
    status: string
    amount: number
    currency: string
    reason: string
    createdAt: string
    buyerId: string
    sellerId: string
    evidenceDueBy?: string
}

export interface DisputeDetail extends Dispute {
    orderSnapshot: any
    timeline: any[]
    messages: any[]
}

export interface DisputeListResponse {
    statusCode: number
    message: string
    data: {
        disputes: Dispute[]
        pagination: {
            page: number
            limit: number
            total: number
            pages: number
        }
    }
}

export interface DisputeDetailResponse {
    statusCode: number
    message: string
    data: {
        dispute: DisputeDetail
        orderSnapshot: any
        timeline: any[]
        messages: any[]
    }
}

class DisputeService {
    private static instance: DisputeService

    private constructor() { }

    public static getInstance(): DisputeService {
        if (!DisputeService.instance) {
            DisputeService.instance = new DisputeService()
        }
        return DisputeService.instance
    }

    async listDisputes(params?: { page?: number; limit?: number; status?: string }): Promise<DisputeListResponse> {
        const response = await apiClient.get('/admin/disputes', { params })
        return response.data
    }

    async getDispute(disputeId: string): Promise<DisputeDetailResponse> {
        const response = await apiClient.get(`/admin/disputes/${disputeId}`)
        return response.data
    }

    async releaseEscrow(disputeId: string, justification: string): Promise<any> {
        const response = await apiClient.post(`/admin/disputes/${disputeId}/release`, { justification })
        return response.data
    }

    async refundToWallet(disputeId: string, justification: string): Promise<any> {
        const response = await apiClient.post(`/admin/disputes/${disputeId}/refund-wallet`, { justification })
        return response.data
    }

    async extendDispute(disputeId: string, days: number, justification: string): Promise<any> {
        const response = await apiClient.post(`/admin/disputes/${disputeId}/extend`, { days, justification })
        return response.data
    }
}

export const disputeService = DisputeService.getInstance()
