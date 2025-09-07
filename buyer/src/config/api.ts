const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const AUTH_API = {
    SIGNUP: `${API_URL}/auth/signup`,
    SIGNIN: `${API_URL}/auth/signin`,
    LOGOUT: `${API_URL}/auth/logout`,
    CONFIRM_EMAIL: `${API_URL}/auth/confirmEmail`,
    RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    REQUEST_RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    UPDATE_PASSWORD: `${API_URL}/auth/updatePassword`,
    EMAIL_LOGIN: `${API_URL}/auth/emailLogin`,
    REQUEST_EMAIL_LOGIN: `${API_URL}/auth/emailLogin`,
    ACCOUNT: `${API_URL}/auth/account`,
    UPDATE_PROFILE: `${API_URL}/auth/profile`,
    REACTIVATE: `${API_URL}/auth/reactivate`,
    REFRESH_TOKEN: `${API_URL}/auth/refresh`,
    GENERATE_SELLER_TOKEN: `${API_URL}/auth/generate-seller-token`,
};

export const WALLET_API = {
    GET_WALLET: `${API_URL}/wallet`,
    CREATE_PAYMENT_INTENT: `${API_URL}/wallet/payment-intent`,
    CREATE_CHECKOUT_SESSION: `${API_URL}/wallet/checkout-session`,
    CONFIRM_PAYMENT: `${API_URL}/wallet/confirm-payment`,
    GET_TRANSACTIONS: `${API_URL}/wallet/transactions`,
};

export const ADMIN_API = {
    CONFIGS: `${API_URL}/public/configs`,
    DELETE_CONFIG: (key: string) => `${API_URL}/public/configs/${key}`,
};

export const OAUTH_API = {
    PROVIDER: (provider: string) => `${API_URL}/${provider}`,
};

export const CART_API = {
    GET_CART: `${API_URL}/cart`,
    GET_CART_SUMMARY: `${API_URL}/cart/summary`,
    ADD_TO_CART: `${API_URL}/cart/add`,
    UPDATE_CART_ITEM: `${API_URL}/cart/update`,
    REMOVE_FROM_CART: `${API_URL}/cart/remove`,
    CLEAR_CART: `${API_URL}/cart/clear`,
};

// Type definitions for API responses
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

const api = {
    AUTH_API,
    ADMIN_API,
    OAUTH_API,
    CART_API,
};

export default api;
