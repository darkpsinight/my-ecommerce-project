const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const API_BASE_URL = API_URL;

export const AUTH_API = {
    SIGNUP: `${API_URL}/auth/signup`,
    SIGNIN: `${API_URL}/auth/admin-signin`,
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
};

export const ADMIN_API = {
    USERS: `${API_URL}/admin/users`,
    USER_DETAIL: (id: string) => `${API_URL}/admin/users/${id}`,
    ORDERS: `${API_URL}/admin/orders`,
    ORDER_DETAIL: (id: string) => `${API_URL}/admin/orders/${id}`,
    DISPUTES: `${API_URL}/admin/disputes`,
    DISPUTE_DETAIL: (id: string) => `${API_URL}/admin/disputes/${id}`,
    SELLERS: `${API_URL}/admin/sellers`,
    SELLER_DETAIL: (id: string) => `${API_URL}/admin/sellers/${id}`,
    ANALYTICS: `${API_URL}/admin/analytics`,
    CONFIGS: `${API_URL}/admin/configs`,
    DELETE_CONFIG: (key: string) => `${API_URL}/admin/configs/${key}`,
    PLATFORM_SETTINGS: `${API_URL}/admin/platform-settings`,
};

export const SUPPORT_API = {
    USERS: `${API_URL}/support/users`,
    ORDERS: `${API_URL}/support/orders`,
    DISPUTES: `${API_URL}/support/disputes`,
};

// Type definitions for API responses
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

const api = {
    AUTH_API,
    ADMIN_API,
    SUPPORT_API,
};

export default api;