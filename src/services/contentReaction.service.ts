import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { ContentReactionRequest, ContentReactionResponse, ContentReactionSummary } from '../types/content';

class ContentReactionService {
    private readonly baseUrl = '/api/content/reactions';

    /**
     * Add or update reaction to content
     */
    async addOrUpdateReaction(request: ContentReactionRequest): Promise<FlowXResponse<ContentReactionResponse>> {
        const response = await apiService.instance.post<FlowXResponse<ContentReactionResponse>>(
            `${this.baseUrl}/react`,
            request
        );
        return response.data;
    }

    /**
     * Remove reaction from content
     */
    async removeReaction(contentId: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `${this.baseUrl}/${contentId}`
        );
        return response.data;
    }

    /**
     * Get all reactions for a content
     */
    async getReactionsByContent(contentId: number): Promise<FlowXResponse<ContentReactionResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentReactionResponse[]>>(
            `${this.baseUrl}/content/${contentId}`
        );
        return response.data;
    }

    /**
     * Get reactions by content and type
     */
    async getReactionsByContentAndType(
        contentId: number, 
        reactionType: string
    ): Promise<FlowXResponse<ContentReactionResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<ContentReactionResponse[]>>(
            `${this.baseUrl}/content/${contentId}/type/${reactionType}`
        );
        return response.data;
    }

    /**
     * Get reaction summary for content
     */
    async getReactionSummary(contentId: number): Promise<FlowXResponse<ContentReactionSummary>> {
        const response = await apiService.instance.get<FlowXResponse<ContentReactionSummary>>(
            `${this.baseUrl}/content/${contentId}/summary`
        );
        return response.data;
    }

    /**
     * Get current user's reaction
     */
    async getUserReaction(contentId: number): Promise<FlowXResponse<ContentReactionResponse | null>> {
        const response = await apiService.instance.get<FlowXResponse<ContentReactionResponse | null>>(
            `${this.baseUrl}/content/${contentId}/my-reaction`
        );
        return response.data;
    }
}

export default new ContentReactionService(); 