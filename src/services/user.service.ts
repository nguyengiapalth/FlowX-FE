import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    UserResponse, 
    UserCreateRequest, 
    UserUpdateRequest,
} from '../types/user';
import type { UserStatus } from '../types/enums/enums';

class UserService {
    /**
     * Create a new user
     */
    async createUser(request: UserCreateRequest): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.post<FlowXResponse<UserResponse>>(
            '/api/user/create',
            request
        );
        return response.data;
    }

    /**
     * Update user by ID
     */
    async updateUser(id: number, request: UserUpdateRequest): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            `/api/user/update/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Update user department
     */
    async updateUserDepartment(id: number, departmentId: number): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            `/api/user/change-department/${id}`,
            null,
            { params: { departmentId } }
        );
        return response.data;
    }

    /**
     * Update user status
     */
    async updateUserStatus(id: number, status: UserStatus): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            `/api/user/update-status/${id}`,
            null,
            { params: { status } }
        );
        return response.data;
    }

    /**
     * Update user position
     */
    async updateUserPosition(id: number, position: string): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            `/api/user/update-position/${id}`,
            null,
            { params: { position } }
        );
        return response.data;
    }

    /**
     * Delete user by ID
     */
    async deleteUser(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/user/delete/${id}`
        );
        return response.data;
    }

    /**
     * Get all users
     */
    async getAllUsers(): Promise<FlowXResponse<UserResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserResponse[]>>(
            '/api/user/getall'
        );
        return response.data;
    }

    /**
     * Get users by department
     */
    async getUsersByDepartment(departmentId: number): Promise<FlowXResponse<UserResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserResponse[]>>(
            `/api/user/get-by-department/${departmentId}`
        );
        return response.data;
    }

    /**
     * Get user by ID
     */
    async getUserById(id: number): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.get<FlowXResponse<UserResponse>>(
            `/api/user/get/${id}`
        );
        return response.data;
    }

    /**
     * Get my profile (current authenticated user)
     */
    async getMyProfile(): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.get<FlowXResponse<UserResponse>>(
            '/api/user/my-profile'
        );
        return response.data;
    }

    /**
     * Update my profile (current authenticated user)
     */
    async updateMyProfile(request: UserUpdateRequest): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            '/api/user/my-profile',
            request
        );
        return response.data;
    }

    /**
     * Update my avatar only (current authenticated user)
     */
    async updateMyAvatar(avatar: string): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            '/api/user/my-avatar',
            avatar
        );
        return response.data;
    }

    /**
     * Update my background only (current authenticated user)
     */
    async updateMyBackground(background: string): Promise<FlowXResponse<UserResponse>> {
        const response = await apiService.instance.put<FlowXResponse<UserResponse>>(
            '/api/user/my-background',
            background
        );
        return response.data;
    }
}

export default new UserService(); 