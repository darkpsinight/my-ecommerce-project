const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const AUTH_API = {
    SIGNUP: `${API_URL}/signup`,
    SIGNIN: `${API_URL}/signin`,
    LOGOUT: `${API_URL}/auth/logout`,
    CONFIRM_EMAIL: `${API_URL}/confirmEmail`,
    REQUEST_CONFIRM_EMAIL: `${API_URL}/confirmEmail`,
    RESET_PASSWORD: `${API_URL}/reset-password`,
    REQUEST_RESET_PASSWORD: `${API_URL}/reset-password`,
    UPDATE_PASSWORD: `${API_URL}/updatePassword`,
    EMAIL_LOGIN: `${API_URL}/emailLogin`,
    REQUEST_EMAIL_LOGIN: `${API_URL}/emailLogin`,
    ACCOUNT: `${API_URL}/account`,
    REACTIVATE: `${API_URL}/reactivate`,
    REFRESH_TOKEN: `${API_URL}/auth/refresh`,
};

export const USER_API = {
    INFO: `${API_URL}/user/info`,
};

export const ADMIN_API = {
    CONFIGS: `${API_URL}/configs`,
    DELETE_CONFIG: (key: string) => `${API_URL}/configs/${key}`,
};

export const OAUTH_API = {
    PROVIDER: (provider: string) => `${API_URL}/${provider}`,
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
    USER_API,
};

export default api;
