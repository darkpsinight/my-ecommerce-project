import axios from 'axios';
import { AUTH_API } from '@/config/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create an axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to get token from Redux store
const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        try {
            const { store } = require('@/redux/store');
            return store.getState().authReducer.token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }
    return null;
};

// Function to get verify token from session storage
const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return sessionStorage.getItem('verifyToken');
    }
    return null;
};

// Function to refresh token
const refreshAuthToken = async (): Promise<boolean> => {
    try {
        const verifyToken = getVerifyToken();
        if (!verifyToken) {
            return false;
        }

        const response = await fetch(AUTH_API.REFRESH_TOKEN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': verifyToken,
            },
            body: JSON.stringify({}),
            credentials: 'include',
        });

        if (response.ok) {
            const data = await response.json();
            if (data.token && data.verifyToken) {
                const { store } = require('@/redux/store');
                const { setTokens } = require('@/redux/features/auth-slice');
                store.dispatch(setTokens({
                    token: data.token,
                    verifyToken: data.verifyToken
                }));
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Token refresh failed in disputes service:', error);
        return false;
    }
};

axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshSuccess = await refreshAuthToken();
            if (refreshSuccess) {
                const newToken = getAuthToken();
                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return axiosInstance(originalRequest);
                }
            }
        }
        return Promise.reject(error);
    }
);

export interface DisputeMessage {
    _id: string;
    disputeId: string;
    senderRole: 'BUYER' | 'SELLER' | 'ADMIN';
    senderId: string;
    messageBody: string;
    createdAt: string;
}

export interface GetMessagesResponse {
    success: boolean;
    message: string;
    data: DisputeMessage[];
}

export interface PostMessageResponse {
    success: boolean;
    message: string;
    data: DisputeMessage;
}

class DisputesService {
    private baseUrl = '/disputes';

    async getMessages(disputeId: string): Promise<GetMessagesResponse> {
        const response = await axiosInstance.get<GetMessagesResponse>(`${this.baseUrl}/${disputeId}/messages`);
        return response.data;
    }

    async postMessage(disputeId: string, messageBody: string): Promise<PostMessageResponse> {
        const response = await axiosInstance.post<PostMessageResponse>(`${this.baseUrl}/${disputeId}/messages`, { messageBody });
        return response.data;
    }
}

export const disputesApi = new DisputesService();
