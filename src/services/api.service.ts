import axios, {type AxiosInstance } from 'axios';
import {envConfig} from "../configs/env.config.ts";
import {useAuthStore} from "../stores/auth-store.ts";

class ApiService {
    private readonly api: AxiosInstance;

    constructor() {
        const { setAccessToken, clearAuth } = useAuthStore.getState();
        this.api = axios.create({
            baseURL: `${envConfig.be.url}`,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true // Important: để gửi cookies
        });

        this.api.interceptors.request.use((config) => {
            const { accessToken } = useAuthStore.getState();
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
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
                        const newToken = response.data.data.token;
                        setAccessToken(newToken);
                        this.api.defaults.headers['Authorization'] = `Bearer ${newToken}`;
                        return this.api(originalRequest);
                    } catch (err) {
                        clearAuth();
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
