import type {ContentTargetType, TaskStatus, PriorityLevel} from './enums.ts';
import type {UserResponse} from './user';
import type {FileResponse} from './file';

export interface TaskResponse {
    id: number;
    title: string;
    description?: string;
    targetType: ContentTargetType;
    targetId: number;
    assigner: UserResponse;
    assignee: UserResponse;
    startDate?: string; // ISO date string
    dueDate?: string; // ISO date string
    completedDate?: string; // ISO date string
    hasFiles?: boolean;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    status: TaskStatus;
    priority: PriorityLevel;
    files?: FileResponse[]; // List of attached files
}

export interface TaskCreateRequest {
    title: string;
    description?: string;
    targetType: ContentTargetType;
    targetId: number;
    assignerId: number;
    assigneeId: number;
    startDate?: string; // ISO date string
    dueDate?: string; // ISO date string
    hasFiles?: boolean;
    status?: TaskStatus;
    priority?: PriorityLevel;
}

export interface TaskUpdateRequest {
    title?: string;
    description?: string;
    targetType?: ContentTargetType;
    targetId?: number;
    assigneeId?: number;
    startDate?: string; // ISO date string
    dueDate?: string; // ISO date string
    completedDate?: string; // ISO date string
    hasFiles?: boolean;
    status?: TaskStatus;
    priority?: PriorityLevel;
}