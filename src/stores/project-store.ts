import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { envConfig } from '../configs/env.config';
import { useAuthStore } from './auth-store';
import projectService from "../services/project.service.ts";

interface Project {
    id: number;
    name: string;
    description?: string;
    status: string;
    progress?: number;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectState {
    // State
    myProjects: Project[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setMyProjects: (projects: Project[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchMyProjects: () => Promise<void>;
    clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set, get) => ({
            // Initial state
            myProjects: [],
            isLoading: false,
            error: null,

            // Actions
            setMyProjects: (projects) => {
                set({ myProjects: projects, error: null });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setError: (error) => {
                set({ error });
            },

            // Data fetching
            fetchMyProjects: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });

                    const response = await projectService.getMyProjects();
                    
                    if (response.data) {
                        set({ myProjects: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            clearProjects: () => {
                set({ myProjects: [], error: null, isLoading: false });
            }
        }),
        {
            name: 'project-storage',
            partialize: (state) => ({ 
                myProjects: state.myProjects
            }),
        }
    )
); 