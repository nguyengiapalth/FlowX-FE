import { apiService } from './api.service';
import type { FlowXResponse } from '../types/common';
import type { 
    DepartmentResponse, 
    DepartmentCreateRequest, 
    DepartmentUpdateRequest 
} from '../types/department';

class DepartmentService {
    /**
     * Get all departments
     */
    async getAllDepartments(): Promise<FlowXResponse<DepartmentResponse[]>> {
        const response = await apiService.instance.get<FlowXResponse<DepartmentResponse[]>>(
            '/api/department/get-all'
        );
        return response.data;
    }

    /**
     * Get department by ID
     */
    async getDepartmentById(id: number): Promise<FlowXResponse<DepartmentResponse>> {
        const response = await apiService.instance.get<FlowXResponse<DepartmentResponse>>(
            `/api/department/get/${id}`
        );
        return response.data;
    }

    /**
     * Create a new department
     */
    async createDepartment(request: DepartmentCreateRequest): Promise<FlowXResponse<DepartmentResponse>> {
        const response = await apiService.instance.post<FlowXResponse<DepartmentResponse>>(
            '/api/department/create',
            request
        );
        return response.data;
    }

    /**
     * Update department by ID
     */
    async updateDepartment(id: number, request: DepartmentUpdateRequest): Promise<FlowXResponse<DepartmentResponse>> {
        const response = await apiService.instance.put<FlowXResponse<DepartmentResponse>>(
            `/api/department/update/${id}`,
            request
        );
        return response.data;
    }

    /**
     * Delete department by ID
     */
    async deleteDepartment(id: number): Promise<FlowXResponse<void>> {
        const response = await apiService.instance.delete<FlowXResponse<void>>(
            `/api/department/delete/${id}`
        );
        return response.data;
    }

    /**
     * Update department background
     */
    async updateDepartmentBackground(id: number, background: string): Promise<FlowXResponse<DepartmentResponse>> {
        const response = await apiService.instance.put<FlowXResponse<DepartmentResponse>>(
            `/api/department/update-background/${id}`,
            background
        );
        return response.data;
    }

    /**
     * Update department manager
     */
    async updateDepartmentManager(id: number, newManagerId: number): Promise<FlowXResponse<DepartmentResponse>> {
        const response = await apiService.instance.put<FlowXResponse<DepartmentResponse>>(
            `/api/department/update-manager/${id}`,
            newManagerId
        );
        return response.data;
    }
}

export default new DepartmentService(); 