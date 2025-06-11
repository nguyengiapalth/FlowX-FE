import type {UserResponse} from './user';

export interface NotificationResponse {
    id: number;
    user: UserResponse;
    title: string;
    content?: string;
    entityType?: string;
    entityId?: number;
    isRead?: boolean;
    createdAt: string; // ISO datetime string
    readAt?: string; // ISO datetime string
}

export interface NotificationCreateRequest {
    userId: number;
    title: string;
    content?: string;
    entityType?: string;
    entityId?: number;
}

export interface NotificationUpdateRequest {
    isRead?: boolean;
}