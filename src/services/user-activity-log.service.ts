import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { UserResponse } from '../types/user';

// Define UserActivityLog interface based on backend entity
interface UserActivityLog {
    id: number;
    user: UserResponse;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

interface UserActivityLogResponse {
    id: number;
    user: UserResponse;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}

class UserActivityLogService {
    /**
     * Get all activity logs grouped by user
     */
    async getAllActivityLogs(): Promise<FlowXResponse<Record<string, UserActivityLog[]>>> {
        const response = await apiService.instance.get<FlowXResponse<Record<string, UserActivityLog[]>>>(
            '/api/activity-log/get-all'
        );
        return response.data;
    }

    /**
     * Get activity logs for a specific user
     */
    async getActivityLogsByUserId(userId: number): Promise<FlowXResponse<UserActivityLogResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserActivityLogResponse[]>>(
            `/api/activity-log/${userId}`
        );
        return response.data;
    }

    /**
     * Get activity logs for current user
     */
    async getMyActivityLogs(): Promise<FlowXResponse<UserActivityLogResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<UserActivityLogResponse[]>>(
            '/api/activity-log/me'
        );
        return response.data;
    }
}

export default new UserActivityLogService(); 