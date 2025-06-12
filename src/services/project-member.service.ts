import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    ProjectMemberResponse, 
    ProjectMemberCreateRequest, 
    ProjectMemberUpdateRequest 
} from '../types/project';
import type { MemberStatus, RoleDefault } from '../types/enums.ts';

class ProjectMemberService {
    /**
     * Create a new project member
     */
    async createProjectMember(request: ProjectMemberCreateRequest): Promise<FlowXResponse<ProjectMemberResponse>> {
        const response = await apiService.instance.post<FlowXResponse<ProjectMemberResponse>>(
            '/api/project-member/add',
            request
        );
        return response.data;
    }

    /**
     * Update project member by ID
     */
    async updateProjectMember(id: number, request: ProjectMemberUpdateRequest): Promise<FlowXResponse<ProjectMemberResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectMemberResponse>>(
            `/api/project-member/update/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Bulk update member status
     */
    async bulkUpdateMemberStatus(memberIds: number[], status: MemberStatus): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            '/api/project-member/bulk-status',
            null,
            { params: { memberIds, status } }
        );
        return response.data;
    }

    /**
     * Delete project member by ID
     */
    async deleteProjectMember(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/project-member/delete/${id}`
        );
        return response.data;
    }

    /**
     * Get project member by ID
     */
    async getProjectMemberById(id: number): Promise<FlowXResponse<ProjectMemberResponse>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectMemberResponse>>(
            `/api/project-member/get/${id}`
        );
        return response.data;
    }

    /**
     * Get members by project ID
     */
    async getMembersByProjectId(projectId: number): Promise<FlowXResponse<ProjectMemberResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectMemberResponse[]>>(
            `/api/project-member/get-by-project/${projectId}`
        );
        return response.data;
    }

    /**
     * Get projects by user ID
     */
    async getProjectsByUserId(userId: number): Promise<FlowXResponse<ProjectMemberResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectMemberResponse[]>>(
            `/api/project-member/user/${userId}`
        );
        return response.data;
    }

    /**
     * Update member role
     */
    async updateMemberRole(id: number, role: RoleDefault): Promise<FlowXResponse<ProjectMemberResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectMemberResponse>>(
            `/api/project-member/${id}/role`,
            role
        );
        return response.data;
    }

    /**
     * Update member status
     */
    async updateMemberStatus(id: number, status: MemberStatus): Promise<FlowXResponse<ProjectMemberResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ProjectMemberResponse>>(
            `/api/project-member/${id}/status`,
            null,
            { params: { status } }
        );
        return response.data;
    }

    /**
     * Get active members by project ID
     */
    async getActiveMembers(projectId: number): Promise<FlowXResponse<ProjectMemberResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ProjectMemberResponse[]>>(
            `/api/project-member/project/${projectId}/active`
        );
        return response.data;
    }
}

export default new ProjectMemberService(); 