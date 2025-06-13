import axios, {type AxiosInstance } from 'axios';
import {envConfig} from "../configs/env.config.ts";

class ApiService {
    private readonly api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: `${envConfig.be.url}`,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true // Important: để gửi cookies
        });

        this.api.interceptors.request.use(async (config) => {
            try {
                // Dynamic import to avoid circular dependency
                const { useAuthStore } = await import("../stores/auth-store.ts");
                const { accessToken } = useAuthStore.getState();
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
            } catch (e) {
                // Store might not be ready yet, continue without token
            }
            return config;
        });

        this.api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        console.log('Token expired, refreshing...', error.response);
                        console.log('Refreshing token...');
                        // Gọi refresh endpoint mới với cookies
                        const response = await axios.post(
                            `${envConfig.be.url}/api/authentication/refresh`,
                            {},
                            { withCredentials: true }
                        );
                        console.log('Token refreshed successfully:', response.data);
                        const newToken = response.data.data.token;
                        
                        try {
                            // Dynamic import to avoid circular dependency
                            const { useAuthStore } = await import("../stores/auth-store.ts");
                            const { setAccessToken } = useAuthStore.getState();
                            setAccessToken(newToken);
                            this.api.defaults.headers['Authorization'] = `Bearer ${newToken}`;
                        } catch (e) {
                            console.error('Could not access auth store:', e);
                        }
                        return this.api(originalRequest);
                    } catch (err) {
                        try {
                            // Dynamic import to avoid circular dependency
                            const { useAuthStore } = await import("../stores/auth-store.ts");
                            const { clearAuth } = useAuthStore.getState();
                            clearAuth();
                        } catch (e) {
                            console.error('Could not access auth store:', e);
                        }
                        console.error('Failed to refresh token:', err);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    get instance() {
        return this.api;
    }
}

export const apiService = new ApiService();
