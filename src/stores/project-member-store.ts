import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import projectMemberService from '../services/project-member.service';
import type { 
    ProjectMemberResponse, 
    ProjectMemberCreateRequest, 
} from '../types/project';
import type { MemberStatus, RoleDefault } from '../types/enums';
import { useAuthStore } from './auth-store';

interface ProjectMemberState {
    // State - cached data
    membersByProject: Record<number, ProjectMemberResponse[]>; // projectId -> members
    projectsByUser: Record<number, ProjectMemberResponse[]>; // userId -> projects
    activeMembers: Record<number, ProjectMemberResponse[]>; // projectId -> active members
    memberById: Record<number, ProjectMemberResponse>; // memberId -> member
    
    // Loading states
    isLoading: boolean;
    loadingStates: {
        fetchingMembersByProject: Record<number, boolean>;
        fetchingProjectsByUser: Record<number, boolean>;
        fetchingActiveMembers: Record<number, boolean>;
        fetchingMemberById: Record<number, boolean>;
        creating: boolean;
        updating: Record<number, boolean>;
        deleting: Record<number, boolean>;
    };
    
    // Error state
    error: string | null;
    
    // Basic setters
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    
    // Cache management
    setMembersByProject: (projectId: number, members: ProjectMemberResponse[]) => void;
    setProjectsByUser: (userId: number, projects: ProjectMemberResponse[]) => void;
    setActiveMembers: (projectId: number, members: ProjectMemberResponse[]) => void;
    setMemberById: (member: ProjectMemberResponse) => void;
    removeMemberFromCache: (memberId: number) => void;
    updateMemberInCache: (member: ProjectMemberResponse) => void;
    
    // Data fetching with caching
    getMembersByProject: (projectId: number, forceRefresh?: boolean) => Promise<ProjectMemberResponse[]>;
    getProjectsByUser: (userId: number, forceRefresh?: boolean) => Promise<ProjectMemberResponse[]>;
    getActiveMembers: (projectId: number, forceRefresh?: boolean) => Promise<ProjectMemberResponse[]>;
    getMemberById: (memberId: number, forceRefresh?: boolean) => Promise<ProjectMemberResponse | null>;
    
    // CRUD operations
    createProjectMember: (request: ProjectMemberCreateRequest) => Promise<ProjectMemberResponse | null>;
    updateMemberRole: (memberId: number, role: RoleDefault) => Promise<ProjectMemberResponse | null>;
    updateMemberStatus: (memberId: number, status: MemberStatus) => Promise<ProjectMemberResponse | null>;
    bulkUpdateMemberStatus: (memberIds: number[], status: MemberStatus) => Promise<boolean>;
    deleteProjectMember: (memberId: number) => Promise<boolean>;
    
    // Cache utilities
    invalidateProjectCache: (projectId: number) => void;
    invalidateUserCache: (userId: number) => void;
    clearAllCache: () => void;
}

export const useProjectMemberStore = create<ProjectMemberState>()(
    persist(
        (set, get) => ({
            // Initial state
            membersByProject: {},
            projectsByUser: {},
            activeMembers: {},
            memberById: {},
            isLoading: false,
            loadingStates: {
                fetchingMembersByProject: {},
                fetchingProjectsByUser: {},
                fetchingActiveMembers: {},
                fetchingMemberById: {},
                creating: false,
                updating: {},
                deleting: {},
            },
            error: null,

            // Basic setters
            setError: (error) => set({ error }),
            setLoading: (loading) => set({ isLoading: loading }),

            // Cache management
            setMembersByProject: (projectId, members) => 
                set(state => ({
                    membersByProject: { ...state.membersByProject, [projectId]: members },
                    loadingStates: {
                        ...state.loadingStates,
                        fetchingMembersByProject: { ...state.loadingStates.fetchingMembersByProject, [projectId]: false }
                    }
                })),

            setProjectsByUser: (userId, projects) => 
                set(state => ({
                    projectsByUser: { ...state.projectsByUser, [userId]: projects },
                    loadingStates: {
                        ...state.loadingStates,
                        fetchingProjectsByUser: { ...state.loadingStates.fetchingProjectsByUser, [userId]: false }
                    }
                })),

            setActiveMembers: (projectId, members) => 
                set(state => ({
                    activeMembers: { ...state.activeMembers, [projectId]: members },
                    loadingStates: {
                        ...state.loadingStates,
                        fetchingActiveMembers: { ...state.loadingStates.fetchingActiveMembers, [projectId]: false }
                    }
                })),

            setMemberById: (member) => 
                set(state => ({
                    memberById: { ...state.memberById, [member.id]: member },
                    loadingStates: {
                        ...state.loadingStates,
                        fetchingMemberById: { ...state.loadingStates.fetchingMemberById, [member.id]: false }
                    }
                })),

            removeMemberFromCache: (memberId) => 
                set(state => {
                    const { [memberId]: removed, ...restMemberById } = state.memberById;
                    
                    // Also remove from project-based caches
                    const updatedMembersByProject = { ...state.membersByProject };
                    const updatedActiveMembers = { ...state.activeMembers };
                    
                    Object.keys(updatedMembersByProject).forEach(projectId => {
                        updatedMembersByProject[+projectId] = updatedMembersByProject[+projectId].filter(m => m.id !== memberId);
                    });
                    
                    Object.keys(updatedActiveMembers).forEach(projectId => {
                        updatedActiveMembers[+projectId] = updatedActiveMembers[+projectId].filter(m => m.id !== memberId);
                    });

                    return {
                        memberById: restMemberById,
                        membersByProject: updatedMembersByProject,
                        activeMembers: updatedActiveMembers,
                    };
                }),

            updateMemberInCache: (member) => 
                set(state => {
                    const updatedMemberById = { ...state.memberById, [member.id]: member };
                    
                    // Update in project-based caches
                    const updatedMembersByProject = { ...state.membersByProject };
                    const updatedActiveMembers = { ...state.activeMembers };
                    
                    Object.keys(updatedMembersByProject).forEach(projectId => {
                        const members = updatedMembersByProject[+projectId];
                        const index = members.findIndex(m => m.id === member.id);
                        if (index !== -1) {
                            updatedMembersByProject[+projectId] = [
                                ...members.slice(0, index),
                                member,
                                ...members.slice(index + 1)
                            ];
                        }
                    });
                    
                    Object.keys(updatedActiveMembers).forEach(projectId => {
                        const members = updatedActiveMembers[+projectId];
                        const index = members.findIndex(m => m.id === member.id);
                        if (index !== -1) {
                            updatedActiveMembers[+projectId] = [
                                ...members.slice(0, index),
                                member,
                                ...members.slice(index + 1)
                            ];
                        }
                    });

                    return {
                        memberById: updatedMemberById,
                        membersByProject: updatedMembersByProject,
                        activeMembers: updatedActiveMembers,
                    };
                }),

            // Data fetching with caching
            getMembersByProject: async (projectId, forceRefresh = false) => {
                const state = get();
                
                // Return cached data if available and not forcing refresh
                if (!forceRefresh && state.membersByProject[projectId] && !state.loadingStates.fetchingMembersByProject[projectId]) {
                    return state.membersByProject[projectId];
                }

                // Check authentication
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return [];
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingMembersByProject: { ...state.loadingStates.fetchingMembersByProject, [projectId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.getMembersByProjectId(projectId);
                    
                    if (response.data) {
                        get().setMembersByProject(projectId, response.data);
                        return response.data;
                    }
                    return [];
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch project members';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingMembersByProject: { ...state.loadingStates.fetchingMembersByProject, [projectId]: false }
                        }
                    }));
                    return [];
                }
            },

            getProjectsByUser: async (userId, forceRefresh = false) => {
                const state = get();
                
                if (!forceRefresh && state.projectsByUser[userId] && !state.loadingStates.fetchingProjectsByUser[userId]) {
                    return state.projectsByUser[userId];
                }

                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return [];
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingProjectsByUser: { ...state.loadingStates.fetchingProjectsByUser, [userId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.getProjectsByUserId(userId);
                    
                    if (response.data) {
                        get().setProjectsByUser(userId, response.data);
                        return response.data;
                    }
                    return [];
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch user projects';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingProjectsByUser: { ...state.loadingStates.fetchingProjectsByUser, [userId]: false }
                        }
                    }));
                    return [];
                }
            },

            getActiveMembers: async (projectId, forceRefresh = false) => {
                const state = get();
                
                if (!forceRefresh && state.activeMembers[projectId] && !state.loadingStates.fetchingActiveMembers[projectId]) {
                    return state.activeMembers[projectId];
                }

                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return [];
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingActiveMembers: { ...state.loadingStates.fetchingActiveMembers, [projectId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.getActiveMembers(projectId);
                    
                    if (response.data) {
                        get().setActiveMembers(projectId, response.data);
                        return response.data;
                    }
                    return [];
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch active members';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingActiveMembers: { ...state.loadingStates.fetchingActiveMembers, [projectId]: false }
                        }
                    }));
                    return [];
                }
            },

            getMemberById: async (memberId, forceRefresh = false) => {
                const state = get();
                
                if (!forceRefresh && state.memberById[memberId] && !state.loadingStates.fetchingMemberById[memberId]) {
                    return state.memberById[memberId];
                }

                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingMemberById: { ...state.loadingStates.fetchingMemberById, [memberId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.getProjectMemberById(memberId);
                    
                    if (response.data) {
                        get().setMemberById(response.data);
                        return response.data;
                    }
                    return null;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch member';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            fetchingMemberById: { ...state.loadingStates.fetchingMemberById, [memberId]: false }
                        }
                    }));
                    return null;
                }
            },

            // CRUD operations
            createProjectMember: async (request) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    set(state => ({
                        loadingStates: { ...state.loadingStates, creating: true },
                        error: null
                    }));

                    const response = await projectMemberService.createProjectMember(request);
                    
                    if (response.data) {
                        // Update caches
                        get().setMemberById(response.data);
                        get().invalidateProjectCache(request.projectId);
                        get().invalidateUserCache(request.userId);
                        
                        set(state => ({
                            loadingStates: { ...state.loadingStates, creating: false }
                        }));
                        
                        return response.data;
                    }
                    return null;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to create project member';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: { ...state.loadingStates, creating: false }
                    }));
                    return null;
                }
            },

            updateMemberRole: async (memberId, role) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            updating: { ...state.loadingStates.updating, [memberId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.updateMemberRole(memberId, role);
                    
                    if (response.data) {
                        get().updateMemberInCache(response.data);
                        
                        set(state => ({
                            loadingStates: {
                                ...state.loadingStates,
                                updating: { ...state.loadingStates.updating, [memberId]: false }
                            }
                        }));
                        
                        return response.data;
                    }
                    return null;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to update member role';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            updating: { ...state.loadingStates.updating, [memberId]: false }
                        }
                    }));
                    return null;
                }
            },

            updateMemberStatus: async (memberId, status) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            updating: { ...state.loadingStates.updating, [memberId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.updateMemberStatus(memberId, status);
                    
                    if (response.data) {
                        get().updateMemberInCache(response.data);
                        
                        set(state => ({
                            loadingStates: {
                                ...state.loadingStates,
                                updating: { ...state.loadingStates.updating, [memberId]: false }
                            }
                        }));
                        
                        return response.data;
                    }
                    return null;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to update member status';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            updating: { ...state.loadingStates.updating, [memberId]: false }
                        }
                    }));
                    return null;
                }
            },

            bulkUpdateMemberStatus: async (memberIds, status) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return false;
                }

                try {
                    set({ isLoading: true, error: null });

                    const response = await projectMemberService.bulkUpdateMemberStatus(memberIds, status);
                    
                    if (response.code === 200 || response.code === 201) {
                        // Invalidate all caches since we don't know which projects are affected
                        get().clearAllCache();
                        
                        set({ isLoading: false });
                        return true;
                    }
                    return false;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to bulk update member status';
                    set({ error: errorMessage, isLoading: false });
                    return false;
                }
            },

            deleteProjectMember: async (memberId) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return false;
                }

                try {
                    set(state => ({
                        loadingStates: {
                            ...state.loadingStates,
                            deleting: { ...state.loadingStates.deleting, [memberId]: true }
                        },
                        error: null
                    }));

                    const response = await projectMemberService.deleteProjectMember(memberId);
                    
                    if (response.code === 200 || response.code === 201) {
                        get().removeMemberFromCache(memberId);
                        
                        set(state => ({
                            loadingStates: {
                                ...state.loadingStates,
                                deleting: { ...state.loadingStates.deleting, [memberId]: false }
                            }
                        }));
                        
                        return true;
                    }
                    return false;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to delete project member';
                    set(state => ({
                        error: errorMessage,
                        loadingStates: {
                            ...state.loadingStates,
                            deleting: { ...state.loadingStates.deleting, [memberId]: false }
                        }
                    }));
                    return false;
                }
            },

            // Cache utilities
            invalidateProjectCache: (projectId) => 
                set(state => {
                    const { [projectId]: removedMembers, ...restMembersByProject } = state.membersByProject;
                    const { [projectId]: removedActive, ...restActiveMembers } = state.activeMembers;
                    
                    return {
                        membersByProject: restMembersByProject,
                        activeMembers: restActiveMembers,
                    };
                }),

            invalidateUserCache: (userId) => 
                set(state => {
                    const { [userId]: removedProjects, ...restProjectsByUser } = state.projectsByUser;
                    
                    return {
                        projectsByUser: restProjectsByUser,
                    };
                }),

            clearAllCache: () => 
                set({
                    membersByProject: {},
                    projectsByUser: {},
                    activeMembers: {},
                    memberById: {},
                    loadingStates: {
                        fetchingMembersByProject: {},
                        fetchingProjectsByUser: {},
                        fetchingActiveMembers: {},
                        fetchingMemberById: {},
                        creating: false,
                        updating: {},
                        deleting: {},
                    },
                }),
        }),
        {
            name: 'project-member-storage',
            partialize: (state) => ({
                membersByProject: state.membersByProject,
                projectsByUser: state.projectsByUser,
                activeMembers: state.activeMembers,
                memberById: state.memberById,
            }),
        }
    )
);