import { apiService } from './api.service';
import type { FlowXResponse, Page } from '../types/common';
import type { 
    NotificationResponse
} from '../types/notification';

class NotificationService {
    /**
     * Get my notifications with pagination
     */
    async getMyNotifications(page: number): Promise<FlowXResponse<Page<NotificationResponse>>> {
        const response = await apiService.instance.get<FlowXResponse<Page<NotificationResponse>>>(
            '/api/notification/my-notifications',
            { params: { page } }
        );
        return response.data;
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            `/api/notification/${id}/mark-read`
        );
        return response.data;
    }

    /**
     * Mark notification as unread
     */
    async markAsUnread(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            `/api/notification/${id}/mark-unread`
        );
        return response.data;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            '/api/notification/mark-all-read'
        );
        return response.data;
    }
}

export default new NotificationService(); 