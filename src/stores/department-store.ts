import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import departmentService from "../services/department.service.ts";

interface Department {
    id: number;
    name: string;
    description?: string;
    memberCount?: number;
    managerId?: number;
    createdAt: string;
    updatedAt: string;
}

interface DepartmentState {
    // State
    departments: Department[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setDepartments: (departments: Department[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchDepartments: () => Promise<void>;
    clearDepartments: () => void;
}

export const useDepartmentStore = create<DepartmentState>()(
    persist(
        (set) => ({
            // Initial state
            departments: [],
            isLoading: false,
            error: null,

            // Actions
            setDepartments: (departments) => {
                set({ departments, error: null });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setError: (error) => {
                set({ error });
            },

            // Data fetching
            fetchDepartments: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await departmentService.getAllDepartments();
                    const departments = response?.data || [];
                    set({ departments, isLoading: false, error: null });
                } catch (error) {
                    console.error('Failed to fetch departments:', error);
                    set({ error: 'Failed to fetch departments', isLoading: false });
                }
            },

            clearDepartments: () => {
                set({ departments: [], error: null, isLoading: false });
            }
        }),
        {
            name: 'department-storage',
            partialize: (state) => ({ 
                departments: state.departments
            }),
        }
    )
); 