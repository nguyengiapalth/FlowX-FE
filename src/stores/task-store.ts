import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TaskResponse, TaskCreateRequest, TaskUpdateRequest } from '../types/task';
import type { TaskStatus, ContentTargetType } from '../types/enums.ts';
import { useAuthStore } from './auth-store';
import taskService from '../services/task.service';

interface TaskState {
    // State
    tasks: TaskResponse[];
    myAssignedTasks: TaskResponse[];
    myCreatedTasks: TaskResponse[];
    currentTask: TaskResponse | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setTasks: (tasks: TaskResponse[]) => void;
    setMyAssignedTasks: (tasks: TaskResponse[]) => void;
    setMyCreatedTasks: (tasks: TaskResponse[]) => void;
    setCurrentTask: (task: TaskResponse | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchAllTasks: () => Promise<void>;
    fetchMyAssignedTasks: () => Promise<void>;
    fetchMyCreatedTasks: () => Promise<void>;
    fetchTaskById: (id: number) => Promise<void>;
    fetchTasksByProject: (projectId: number) => Promise<void>;
    fetchTasksByDepartment: (departmentId: number) => Promise<void>;
    fetchTasksByStatus: (status: TaskStatus) => Promise<void>;
    
    // CRUD operations
    createTask: (request: TaskCreateRequest) => Promise<TaskResponse>;
    updateTask: (id: number, request: TaskUpdateRequest) => Promise<TaskResponse>;
    updateTaskStatus: (id: number, status: TaskStatus) => Promise<TaskResponse>;
    markTaskCompleted: (id: number) => Promise<TaskResponse>;
    markTaskIncomplete: (id: number) => Promise<TaskResponse>;
    deleteTask: (id: number) => Promise<void>;
    syncTaskFiles: (id: number) => Promise<void>;
    
    // Utility
    addTask: (task: TaskResponse) => void;
    updateTaskInList: (updatedTask: TaskResponse) => void;
    removeTask: (id: number) => void;
    clearTasks: () => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            // Initial state
            tasks: [],
            myAssignedTasks: [],
            myCreatedTasks: [],
            currentTask: null,
            isLoading: false,
            error: null,

            // Actions
            setTasks: (tasks) => {
                set({ tasks, error: null });
            },

            setMyAssignedTasks: (tasks) => {
                set({ myAssignedTasks: tasks, error: null });
            },

            setMyCreatedTasks: (tasks) => {
                set({ myCreatedTasks: tasks, error: null });
            },

            setCurrentTask: (task) => {
                set({ currentTask: task, error: null });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setError: (error) => {
                set({ error });
            },

            // Data fetching
            fetchAllTasks: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getAllTasks();
                    
                    if (response.code === 200 && response.data) {
                        set({ tasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tasks';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchMyAssignedTasks: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getMyAssignedTasks();
                    
                    if (response.code === 200 && response.data) {
                        set({ myAssignedTasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch assigned tasks';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchMyCreatedTasks: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getMyCreatedTasks();
                    
                    if (response.code === 200 && response.data) {
                        set({ myCreatedTasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch created tasks';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchTaskById: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getTaskById(id);
                    
                    if (response.code === 200 && response.data) {
                        set({ currentTask: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch task';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchTasksByProject: async (projectId: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getTasksByProjectId(projectId);
                    
                    if (response.code === 200 && response.data) {
                        set({ tasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch project tasks';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchTasksByDepartment: async (departmentId: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getTasksByDepartmentId(departmentId);
                    
                    if (response.code === 200 && response.data) {
                        set({ tasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch department tasks';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchTasksByStatus: async (status: TaskStatus) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.getTasksByStatus(status);
                    
                    if (response.code === 200 && response.data) {
                        set({ tasks: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch tasks by status';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            // CRUD operations
            createTask: async (request: TaskCreateRequest) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.createTask(request);
                    
                    if (response.code === 200 && response.data) {
                        const newTask = response.data;
                        set((state) => ({
                            tasks: [newTask, ...state.tasks],
                            isLoading: false
                        }));
                        return newTask;
                    }
                    throw new Error(response.message || 'Failed to create task');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to create task';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            updateTask: async (id: number, request: TaskUpdateRequest) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.updateTask(id, request);
                    
                    if (response.code === 200 && response.data) {
                        const updatedTask = response.data;
                        get().updateTaskInList(updatedTask);
                        set({ isLoading: false });
                        return updatedTask;
                    }
                    throw new Error(response.message || 'Failed to update task');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to update task';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            updateTaskStatus: async (id: number, status: TaskStatus) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.updateTaskStatus(id, status);
                    
                    if (response.code === 200 && response.data) {
                        const updatedTask = response.data;
                        get().updateTaskInList(updatedTask);
                        set({ isLoading: false });
                        return updatedTask;
                    }
                    throw new Error(response.message || 'Failed to update task status');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to update task status';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            markTaskCompleted: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.markTaskCompleted(id);
                    
                    if (response.code === 200 && response.data) {
                        const updatedTask = response.data;
                        get().updateTaskInList(updatedTask);
                        set({ isLoading: false });
                        return updatedTask;
                    }
                    throw new Error(response.message || 'Failed to complete task');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to complete task';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            markTaskIncomplete: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.markTaskIncomplete(id);
                    
                    if (response.code === 200 && response.data) {
                        const updatedTask = response.data;
                        get().updateTaskInList(updatedTask);
                        set({ isLoading: false });
                        return updatedTask;
                    }
                    throw new Error(response.message || 'Failed to mark task incomplete');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to mark task incomplete';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            deleteTask: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await taskService.deleteTask(id);
                    
                    if (response.code === 200) {
                        get().removeTask(id);
                        set({ isLoading: false });
                    } else {
                        throw new Error(response.message || 'Failed to delete task');
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete task';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            syncTaskFiles: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    const response = await taskService.syncTaskFiles(id);
                    if (response.code !== 200) {
                        throw new Error(response.message || 'Failed to sync task files');
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to sync task files';
                    set({ error: errorMessage });
                    throw error;
                }
            },

            // Utility
            addTask: (task) => {
                set((state) => ({
                    tasks: [task, ...state.tasks]
                }));
            },

            updateTaskInList: (updatedTask) => {
                set((state) => ({
                    tasks: state.tasks.map(task => 
                        task.id === updatedTask.id ? updatedTask : task
                    ),
                    myAssignedTasks: state.myAssignedTasks.map(task => 
                        task.id === updatedTask.id ? updatedTask : task
                    ),
                    myCreatedTasks: state.myCreatedTasks.map(task => 
                        task.id === updatedTask.id ? updatedTask : task
                    ),
                    currentTask: state.currentTask?.id === updatedTask.id ? updatedTask : state.currentTask
                }));
            },

            removeTask: (id) => {
                set((state) => ({
                    tasks: state.tasks.filter(task => task.id !== id),
                    myAssignedTasks: state.myAssignedTasks.filter(task => task.id !== id),
                    myCreatedTasks: state.myCreatedTasks.filter(task => task.id !== id),
                    currentTask: state.currentTask?.id === id ? null : state.currentTask
                }));
            },

            clearTasks: () => {
                set({ 
                    tasks: [], 
                    myAssignedTasks: [], 
                    myCreatedTasks: [], 
                    currentTask: null, 
                    error: null, 
                    isLoading: false 
                });
            }
        }),
        {
            name: 'task-storage',
            partialize: (state) => ({ 
                tasks: state.tasks,
                myAssignedTasks: state.myAssignedTasks,
                myCreatedTasks: state.myCreatedTasks
            }),
        }
    )
); 