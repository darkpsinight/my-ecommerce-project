const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const AUTH_API = {
    SIGNUP: `${API_URL}/seller/signup`,
    SIGNIN: `${API_URL}/seller/signin`,
    LOGOUT: `${API_URL}/seller/logout`,
    CONFIRM_EMAIL: `${API_URL}/seller/confirmEmail`,
    RESET_PASSWORD: `${API_URL}/seller/reset-password`,
    REQUEST_RESET_PASSWORD: `${API_URL}/seller/reset-password`,
    UPDATE_PASSWORD: `${API_URL}/seller/updatePassword`,
    EMAIL_LOGIN: `${API_URL}/seller/emailLogin`,
    REQUEST_EMAIL_LOGIN: `${API_URL}/seller/emailLogin`,
    ACCOUNT: `${API_URL}/seller/account`,
    REACTIVATE: `${API_URL}/seller/reactivate`,
    REFRESH_TOKEN: `${API_URL}/seller/auth/refresh`,
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