import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    ProjectResponse, 
    ProjectCreateRequest, 
    ProjectUpdateRequest 
} from '../types/project';
import type { ProjectStatus } from '../types/enums.ts';
import type { ProjectMemberResponse } from '../types/project';

class ProjectService {
    /**
     * Create a new project
     */
    async createProject(request: ProjectCreateRequest): Promise<FlowXResponse<ProjectResponse>> {
        const response = await apiService.instance.post<FlowXResponse<ProjectResponse>>(
            '/api/project/create',
            request
        );
        return response.data;
    }

    /**
     * Update project by ID
     */
    async updateProject(id: number, request: ProjectUpdateRequest): Promise<FlowXResponse<ProjectResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectResponse>>(
            `/api/project/update/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Update project status
     */
    async updateProjectStatus(id: number, status: ProjectStatus): Promise<FlowXResponse<ProjectResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectResponse>>(
            `/api/project/${id}/status`,
            null,
            { params: { status } }
        );
        return response.data;
    }

    /**
     * Complete project
     */
    async completeProject(id: number): Promise<FlowXResponse<ProjectResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectResponse>>(
            `/api/project/${id}/complete`
        );
        return response.data;
    }

    /**
     * Delete project by ID
     */
    async deleteProject(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/project/delete/${id}`
        );
        return response.data;
    }

    /**
     * Get all projects
     */
    async getAllProjects(): Promise<FlowXResponse<ProjectResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectResponse[]>>(
            '/api/project/getall'
        );
        return response.data;
    }

    /**
     * Get project by ID
     */
    async getProjectById(id: number): Promise<FlowXResponse<ProjectResponse>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectResponse>>(
            `/api/project/get/${id}`
        );
        return response.data;
    }

    /**
     * Get projects by status
     */
    async getProjectsByStatus(status: ProjectStatus): Promise<FlowXResponse<ProjectResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectResponse[]>>(
            '/api/project/get/status',
            { params: { status } }
        );
        return response.data;
    }

    /**
     * Get projects by department ID
     */
    async getProjectsByDepartmentId(departmentId: number): Promise<FlowXResponse<ProjectResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectResponse[]>>(
            `/api/project/get/department/${departmentId}`
        );
        return response.data;
    }

    /**
     * Get my projects
     */
    async getMyProjects(): Promise<FlowXResponse<ProjectResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectResponse[]>>(
            '/api/project/my-projects'
        );
        return response.data;
    }

    /**
     * Get project members by project ID
     */
    async getProjectMembers(projectId: number): Promise<FlowXResponse<ProjectMemberResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectMemberResponse[]>>(
            `/api/project/members/${projectId}`
        );
        return response.data;
    }
}

export default new ProjectService(); 