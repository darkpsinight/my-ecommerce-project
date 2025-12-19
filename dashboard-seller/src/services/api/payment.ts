import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Function to get token (helper for services)
const getAuthToken = (): string | null => {
    try {
        const { store } = require('src/redux/store');
        return store.getState().auth.token;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

export interface StripeConnectResponse {
    url: string;
    expiresAt: number;
}

export interface StripeAccountStatus {
    hasAccount: boolean;
    stripeAccountId?: string;
    detailsSubmitted?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    requirements?: any;
}

export const connectStripeAccount = async (country: string = 'US', businessType: string = 'individual'): Promise<StripeConnectResponse> => {
    try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token is missing');

        const response = await axios.post(
            `${API_URL}/seller/stripe/connect`,
            { country, businessType },
            {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            }
        );

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error || 'Failed to initiate Stripe Connect');
        }
    } catch (error: any) {
        console.error('Error connecting Stripe account:', error);
        throw error.response?.data?.error || error.message || 'Failed to connect Stripe account';
    }
};

export const getStripeAccountStatus = async (): Promise<StripeAccountStatus> => {
    try {
        const token = getAuthToken();
        if (!token) throw new Error('Authentication token is missing');

        const response = await axios.get(
            `${API_URL}/seller/stripe/status`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true
            }
        );

        if (response.data.success) {
            return response.data.data;
        } else {
            throw new Error(response.data.error || 'Failed to get account status');
        }
    } catch (error: any) {
        console.error('Error getting Stripe account status:', error);
        throw error.response?.data?.error || error.message || 'Failed to get Stripe account status';
    }
};
