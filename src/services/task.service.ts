import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    TaskResponse, 
    TaskCreateRequest, 
    TaskUpdateRequest 
} from '../types/task';
import type { TaskStatus } from '../types/enums.ts';

class TaskService {
    /**
     * Create a new task
     */
    async createTask(request: TaskCreateRequest): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.post<FlowXResponse<TaskResponse>>(
            '/api/task',
            request
        );
        return response.data;
    }

    /**
     * Update task by ID
     */
    async updateTask(id: number, request: TaskUpdateRequest): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.put<FlowXResponse<TaskResponse>>(
            `/api/task/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Update task status
     */
    async updateTaskStatus(id: number, status: TaskStatus): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.put<FlowXResponse<TaskResponse>>(
            `/api/task/${id}/status`,
            null,
            { params: { status } }
        );
        return response.data;
    }

    /**
     * Mark task as completed
     */
    async markTaskCompleted(id: number): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.put<FlowXResponse<TaskResponse>>(
            `/api/task/${id}/complete`
        );
        return response.data;
    }

    /**
     * Mark task as incomplete
     */
    async markTaskIncomplete(id: number): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.put<FlowXResponse<TaskResponse>>(
            `/api/task/${id}/incomplete`
        );
        return response.data;
    }

    /**
     * Delete task by ID
     */
    async deleteTask(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/task/${id}`
        );
        return response.data;
    }

    /**
     * Get task by ID
     */
    async getTaskById(id: number): Promise<FlowXResponse<TaskResponse>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse>>(
            `/api/task/${id}`
        );
        return response.data;
    }

    /**
     * Get all tasks
     */
    async getAllTasks(): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            '/api/task'
        );
        return response.data;
    }

    /**
     * Get tasks by project ID
     */
    async getTasksByProjectId(projectId: number): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            `/api/task/project/${projectId}`
        );
        return response.data;
    }

    /**
     * Get tasks by department ID
     */
    async getTasksByDepartmentId(departmentId: number): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            `/api/task/department/${departmentId}`
        );
        return response.data;
    }

    /**
     * Get tasks by status
     */
    async getTasksByStatus(status: TaskStatus): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            `/api/task/status/${status}`
        );
        return response.data;
    }

    /**
     * Get tasks created by current user
     */
    async getMyCreatedTasks(): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            '/api/task/my-created'
        );
        return response.data;
    }

    /**
     * Get tasks assigned to current user
     */
    async getMyAssignedTasks(): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            '/api/task/my-assigned'
        );
        return response.data;
    }

    /**
     * Get my tasks by project ID
     */
    async getMyTasksByProjectId(projectId: number): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            `/api/task/my-assigned/project/${projectId}`
        );
        return response.data;
    }

    /**
     * Get my tasks by status
     */
    async getMyTasksByStatus(status: TaskStatus): Promise<FlowXResponse<TaskResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<TaskResponse[]>>(
            `/api/task/my-assigned/status/${status}`
        );
        return response.data;
    }

    /**
     * Sync task files - update hasFiles flag based on actual files
     */
    async syncTaskFiles(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.put<FlowXResponse<void>>(
            `/api/task/${id}/sync-files`
        );
        return response.data;
    }
}

export default new TaskService(); 