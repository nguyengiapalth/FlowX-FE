import type {MemberStatus, PriorityLevel, ProjectStatus, RoleDefault} from './enums.ts';
import type {DepartmentResponse} from './department';
import type {UserResponse} from './user';



export interface ProjectResponse {
    id: number;
    name: string;
    description?: string;
    background?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    department: DepartmentResponse;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    status: ProjectStatus;
    priority: PriorityLevel;
}

export interface ProjectCreateRequest {
    name: string;
    description?: string;
    background?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    departmentId: number;
    createdById: number;
    status?: ProjectStatus;
    priority?: PriorityLevel;
    memberIds?: number[]; // Array of user IDs to be added as members
}

export interface ProjectUpdateRequest {
    name?: string;
    description?: string;
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
    status?: ProjectStatus;
    priority?: PriorityLevel;
}

export interface ProjectMemberResponse {
    id: number;
    project: ProjectResponse;
    user: UserResponse;
    role: RoleDefault;
    joinDate: string; // ISO date string
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    status: MemberStatus;
}

export interface ProjectMemberCreateRequest {
    projectId: number;
    userId: number;
    role: RoleDefault;
    status?: MemberStatus;
}

export interface ProjectMemberUpdateRequest {
    role?: RoleDefault;
    status?: MemberStatus;
}