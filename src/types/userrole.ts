import type {RoleScope} from './enums/enums.ts';
import type {UserResponse} from './user';


export interface Role {
    id: number;
    name: string;
    description?: string;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
}

export interface RoleResponse {
    id: number;
    name: string;
    description?: string;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
}

export interface RoleRequest {
    name: string;
    description?: string;
}


export interface UserRoleResponse {
    id: number;
    user: UserResponse;
    role: RoleResponse;
    scope: RoleScope;
    scopeId: number;
    createdAt: string; // ISO datetime string
}

export interface UserRoleCreateRequest {
    userId: number;
    roleId: number;
    scope: RoleScope;
    scopeId: number;
}

export interface UserRoleUpdateRequest {
    roleId?: number;
    scope?: string;
}