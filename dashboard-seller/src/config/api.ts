const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const AUTH_API = {
    SIGNUP: `${API_URL}/auth/signup`,
    SIGNIN: `${API_URL}/seller/signin`,
    LOGOUT: `${API_URL}/auth/logout`,
    CONFIRM_EMAIL: `${API_URL}/auth/confirmEmail`,
    RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    REQUEST_RESET_PASSWORD: `${API_URL}/auth/reset-password`,
    UPDATE_PASSWORD: `${API_URL}/auth/updatePassword`,
    EMAIL_LOGIN: `${API_URL}/auth/emailLogin`,
    REQUEST_EMAIL_LOGIN: `${API_URL}/auth/emailLogin`,
    ACCOUNT: `${API_URL}/auth/account`,
    REACTIVATE: `${API_URL}/auth/reactivate`,
    REFRESH_TOKEN: `${API_URL}/auth/refresh`,
    VALIDATE_SELLER_TOKEN: `${API_URL}/auth/validate-seller-token`,
};

export const SELLER_API = {
    PRODUCTS: `${API_URL}/seller/products`,
    PRODUCT_DETAIL: (id: string) => `${API_URL}/seller/products/${id}`,
    ORDERS: `${API_URL}/seller/orders`,
    ORDER_DETAIL: (id: string) => `${API_URL}/seller/orders/${id}`,
    INVENTORY: `${API_URL}/seller/inventory`,
    SALES: `${API_URL}/seller/sales`,
    ANALYTICS: `${API_URL}/seller/analytics`,
};

export const ADMIN_API = {
    CONFIGS: `${API_URL}/public/configs`,
    DELETE_CONFIG: (key: string) => `${API_URL}/seller/configs/${key}`,
};

export const OAUTH_API = {
    PROVIDER: (provider: string) => `${API_URL}/seller/${provider}`,
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
    SELLER_API,
    ADMIN_API,
    OAUTH_API,
};

export default api;