import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    UserRoleResponse, 
    UserRoleCreateRequest 
} from '../types/userrole';

class UserRoleService {
    /**
     * Get all roles for a user
     */
    async getRolesForUser(userId: number): Promise<FlowXResponse<UserRoleResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserRoleResponse[]>>(
            `/api/user-role/user/${userId}`
        );
        return response.data;
    }

    /**
     * Get my roles
     */
    async getMyRoles(): Promise<FlowXResponse<UserRoleResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserRoleResponse[]>>(
            `/api/user-role/my-roles`
        );
        return response.data;
    }

    /**
     * Get all users for a role
     */
    async getUsersForRole(roleId: number): Promise<FlowXResponse<UserRoleResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserRoleResponse[]>>(
            `/api/user-role/role/${roleId}`
        );
        return response.data;
    }

    /**
     * Assign role to user
     */
    async assignRoleToUser(request: UserRoleCreateRequest): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.post<FlowXResponse<void>>(
            '/api/user-role/assign',
            request
        );
        return response.data;
    }

    /**
     * Delete role from user
     */
    async deleteRoleFromUser(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/user-role/delete/${id}`
        );
        return response.data;
    }
}

export default new UserRoleService(); 