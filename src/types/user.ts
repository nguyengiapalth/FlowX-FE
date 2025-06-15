import type {UserStatus} from './enums.ts';
import type {DepartmentResponse} from "./department.ts";

export interface UserResponse {
    id: number;
    email: string;
    fullName: string;
    avatar?: string;
    background?: string;
    phoneNumber?: string;
    dateOfBirth?: string; // ISO date string
    address?: string;
    position?: string;
    joinDate?: string; // ISO date string
    department?: DepartmentResponse;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    status?: UserStatus;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
}

export interface UserCreateRequest {
    email: string;
    fullName: string;
    avatar?: string;
    background?: string;
    phoneNumber?: string;
    dateOfBirth?: string; // ISO date string
    address?: string;
    position?: string;
    status?: UserStatus;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    bio?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
}

export interface UserUpdateRequest {
    fullName?: string;
    email?: string;
    position?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    departmentId?: number;
}

export interface UserActivityLogResponse {
    id: number;
    user: UserResponse;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string; // ISO datetime string
}

export interface UserActivityLogCreateRequest {
    userId: number;
    action: string;
    entityType?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
}