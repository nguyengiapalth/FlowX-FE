import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    AuthenticationRequest, 
    AuthenticationResponse, 
    ChangePasswordRequest, 
    LogoutRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
} from '../types/auth';
import {useAuthStore} from "../stores/auth-store.ts";

class AuthService {
    /**
     * Login with email and password
     */
    async login(request: AuthenticationRequest): Promise<FlowXResponse<AuthenticationResponse>> {
        const response = await apiService.instance.post<FlowXResponse<AuthenticationResponse>>(
            '/api/authentication/login',
            request
        );
        return response.data;
    }

    /**
     * Change password for authenticated user
     */
    async changePassword(request: ChangePasswordRequest): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            '/api/authentication/change-password',
            request
        );
        return response.data;
    }

    /**
     * Logout current user
     */
    async logout(): Promise<FlowXResponse<void>> {
        const accessToken = useAuthStore.getState().accessToken;
        const request: LogoutRequest = {
            token: accessToken || ''
        }
        const response = await apiService.instance.post<FlowXResponse<void>>(
            '/api/authentication/logout',
            request
        );
        return response.data;
    }

    /**
     * Request password reset email
     */
    async forgotPassword(request: ForgotPasswordRequest): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.post<FlowXResponse<void>>(
            '/api/authentication/forgot-password',
            request
        );
        return response.data;
    }

    /**
     * Reset password with token
     */
    async resetPassword(request: ResetPasswordRequest): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.post<FlowXResponse<void>>(
            '/api/authentication/reset-password',
            request
        );
        return response.data;
    }

    /**
     * Authenticate with Google OAuth2
     */
    async authenticateWithGoogle(idToken: string): Promise<FlowXResponse<AuthenticationResponse>> {
        const response = await apiService.instance.post<FlowXResponse<AuthenticationResponse>>(
            '/api/authentication/google-oath2',
            { idToken }
        );
        return response.data;
    }

    /**
     * Refresh access token using refresh token from cookies
     */
    async refreshToken(): Promise<FlowXResponse<AuthenticationResponse>> {
        const response = await apiService.instance.post<FlowXResponse<AuthenticationResponse>>(
            '/api/authentication/refresh'
        );
        return response.data;
    }
}

export default new AuthService(); 