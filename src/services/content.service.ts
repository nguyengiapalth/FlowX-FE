import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    ContentCreateRequest,
    ContentUpdateRequest,
    ContentResponse
} from '../types/content';
import type { ContentTargetType } from '../types/enums.ts';

class ContentService {
    /**
     * Create new content
     */
    async createContent(request: ContentCreateRequest): Promise<FlowXResponse<ContentResponse>> {
        const response = await apiService.instance.post<FlowXResponse<ContentResponse>>(
            '/api/content/create',
            request
        );
        return response.data;
    }

    /**
     * Update content by ID
     */
    async updateContent(id: number, request: ContentUpdateRequest): Promise<FlowXResponse<ContentResponse>> {
        const response = await apiService.instance.put<FlowXResponse<ContentResponse>>(
            `/api/content/update/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Delete content by ID
     */
    async deleteContent(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/content/delete/${id}`
        );
        return response.data;
    }

    /**
     * Get content by ID
     */
    async getContentById(id: number): Promise<FlowXResponse<ContentResponse>> {
        const response = await apiService.instance.get<FlowXResponse<ContentResponse>>(
            `/api/content/get/${id}`
        );
        return response.data;
    }

    /**
     * Get all contents
     */
    async getAllContents(): Promise<FlowXResponse<ContentResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentResponse[]>>(
            '/api/content/get-all'
        );
        return response.data;
    }

    /**
     * Get global contents
     */
    async getGlobalContents(): Promise<FlowXResponse<ContentResponse[]>> {
        const contentTargetType = 'GLOBAL';
        const targetId = 0;
        const response = await apiService.instance.get<FlowXResponse<ContentResponse[]>>(
            `/api/content/target/${contentTargetType}/${targetId}`
        );
        return response.data;
    }

    /**
     * Get contents by target type and ID
     */
    async getContentsByTarget(
        contentTargetType: ContentTargetType, 
        targetId: number
    ): Promise<FlowXResponse<ContentResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentResponse[]>>(
            `/api/content/target/${contentTargetType}/${targetId}`
        );
        return response.data;
    }

    /**
     * Get contents by parent ID (replies)
     */
    async getContentsByParent(parentId: number): Promise<FlowXResponse<ContentResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentResponse[]>>(
            `/api/content/parent/${parentId}`
        );
        return response.data;
    }

    /**
     * Get contents by user ID (author)
     */
    async getContentsByUser(userId: number): Promise<FlowXResponse<ContentResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentResponse[]>>(
            `/api/content/user/${userId}`
        );
        return response.data;
    }
}

export default new ContentService(); 