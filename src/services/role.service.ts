import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';

// Define Role interface based on backend entity
interface Role {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

class RoleService {
    /**
     * Get all roles
     */
    async getAllRoles(): Promise<FlowXResponse<Role[]>> {
        const response = await apiService.instance.get<FlowXResponse<Role[]>>(
            '/api/role'
        );
        return response.data;
    }
}

export default new RoleService(); 