import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth-store';
import projectService from "../services/project.service.ts";
import type {ProjectResponse} from "../types/project.ts";

interface ProjectState {
    // State
    myProjects: ProjectResponse[];
    currentProject: ProjectResponse | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setMyProjects: (projects: ProjectResponse[]) => void;
    setCurrentProject: (project: ProjectResponse | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchMyProjects: () => Promise<void>;
    fetchProjectById: (id: number) => Promise<ProjectResponse | null>;
    
    // CRUD operations
    updateProjectInStore: (updatedProject: ProjectResponse) => void;
    removeProjectFromStore: (projectId: number) => void;
    addProjectToStore: (newProject: ProjectResponse) => void;
    
    // Utilities
    getProjectById: (id: number) => ProjectResponse | null;
    clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            // Initial state
            myProjects: [],
            currentProject: null,
            isLoading: false,
            error: null,

            // Actions
            setMyProjects: (projects) => {
                set({ myProjects: projects, error: null });
            },

            setCurrentProject: (project) => {
                set({ currentProject: project });
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

                    const response = await projectService.getAllProjects();
                    
                    if (response.data) {
                        set({ myProjects: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch projects';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchProjectById: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    set({ isLoading: true, error: null });

                    const response = await projectService.getProjectById(id);
                    
                    if (response.data) {
                        set({ currentProject: response.data, isLoading: false });
                        return response.data;
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch project';
                    set({ error: errorMessage, isLoading: false });
                }
                return null;
            },

            // CRUD operations
            updateProjectInStore: (updatedProject: ProjectResponse) => {
                set((state) => ({
                    myProjects: state.myProjects.map((project) =>
                        project.id === updatedProject.id ? updatedProject : project
                    ),
                    currentProject: updatedProject,
                    error: null
                }));
            },

            removeProjectFromStore: (projectId: number) => {
                set((state) => ({
                    myProjects: state.myProjects.filter((project) => project.id !== projectId),
                    currentProject: null,
                    error: null
                }));
            },

            addProjectToStore: (newProject: ProjectResponse) => {
                set((state) => ({
                    myProjects: [...state.myProjects, newProject],
                    currentProject: newProject,
                    error: null
                }));
            },

            // Utilities
            getProjectById: (id: number) => {
                return useProjectStore.getState().myProjects.find((project) => project.id === id) || null;
            },

            clearProjects: () => {
                set({ myProjects: [], currentProject: null, error: null, isLoading: false });
            }
        }),
        {
            name: 'project-storage',
            partialize: (state) => ({ 
                myProjects: state.myProjects,
                currentProject: state.currentProject,
                isLoading: state.isLoading,
                error: state.error
            }),
        }
    )
); 