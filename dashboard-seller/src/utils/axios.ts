import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

axiosInstance.interceptors.request.use(
    (config) => {
        try {
            // Use dynamic require to avoid circular dependency with store
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { store } = require('src/redux/store');
            const state = store.getState();
            const token = state.auth.token;

            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error attaching auth token', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
