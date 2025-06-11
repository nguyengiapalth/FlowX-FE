import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    FileResponse, 
    FileCreateRequest, 
    PresignedUploadResponse,
    BatchDeleteRequest
} from '../types/file';
import type { FileTargetType } from '../types/enums/enums';

class FileService {
    /**
     * Get presigned download URL for a file
     */
    async getPresignedDownloadUrl(fileId: number): Promise<FlowXResponse<string>> {
        const response = await apiService.instance.get<FlowXResponse<string>>(
            `/api/file/presigned-download/${fileId}`
        );
        return response.data;
    }

    /**
     * Get presigned upload URL for uploading a file
     */
    async getPresignedUploadUrl(request: FileCreateRequest): Promise<FlowXResponse<PresignedUploadResponse>> {
        const response = await apiService.instance.post<FlowXResponse<PresignedUploadResponse>>(
            '/api/file/presigned-upload',
            request
        );
        return response.data;
    }

    /**
     * Delete file by ID
     */
    async deleteFile(fileId: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/file/${fileId}`
        );
        return response.data;
    }

    /**
     * Get file information by ID
     */
    async getFileInfo(fileId: number): Promise<FlowXResponse<FileResponse>> {
        const response = await apiService.instance.get<FlowXResponse<FileResponse>>(
            `/api/file/${fileId}`
        );
        return response.data;
    }

    /**
     * Get files by entity type and ID
     */
    async getFilesByEntity(
        fileTargetType: FileTargetType, 
        entityId: number
    ): Promise<FlowXResponse<FileResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<FileResponse[]>>(
            `/api/file/entity/${fileTargetType}/${entityId}`
        );
        return response.data;
    }

    /**
     * Get files uploaded by current user
     */
    async getMyFiles(): Promise<FlowXResponse<FileResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<FileResponse[]>>(
            '/api/file/my-files'
        );
        return response.data;
    }

    /**
     * Batch delete multiple files
     */
    async batchDeleteFiles(request: BatchDeleteRequest): Promise<FlowXResponse<Record<string, any>>> {
        const response = await apiService.instance.delete<FlowXResponse<Record<string, any>>>(
            '/api/file/batch',
            { data: request }
        );
        return response.data;
    }
}

export default new FileService(); 