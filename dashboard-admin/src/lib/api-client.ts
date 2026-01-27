import axios from 'axios';
import { AUTH_API } from '@/config/api';
import { useAuthStore } from '@/stores/auth-store';

const apiClient = axios.create({
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().auth.accessToken;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Mutex for refreshing
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Handle 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if the request is an Auth endpoint that should NOT trigger refresh loop
        const isAuthRequest =
            originalRequest.url?.includes('/auth/signin') ||
            originalRequest.url?.includes('/auth/admin-signin') ||
            originalRequest.url?.includes('/auth/seller-signin') ||
            originalRequest.url?.includes('/auth/support-signin') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/logout') ||
            originalRequest.url?.includes('generate-seller-token');

        // If 401 and NOT an auth request and NOT already retried
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Use raw axios to avoid interceptors
                const response = await axios.post(
                    AUTH_API.REFRESH_TOKEN,
                    {},
                    { withCredentials: true }
                );

                const { token } = response.data;

                // Update store
                useAuthStore.getState().auth.setAccessToken(token);

                processQueue(null, token);

                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                // Force logout
                useAuthStore.getState().auth.reset();

                // Optional: Redirect to login if not handled by router
                // window.location.href = '/sign-in'; 

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export { apiClient };
