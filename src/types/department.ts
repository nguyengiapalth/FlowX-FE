export interface DepartmentResponse {
    id: number;
    name: string;
    description?: string;
    background?: string;
    managerId?: number;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
}

export interface DepartmentCreateRequest {
    name: string;
    description?: string | undefined;
}

export interface DepartmentUpdateRequest {
    name?: string;
    description?: string;
}