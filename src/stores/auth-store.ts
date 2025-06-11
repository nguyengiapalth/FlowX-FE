import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {UserRoleResponse} from "../types/userrole.ts";
import { isJWTExpired, isValidJWTFormat } from '../utils/jwt.utils';
import { hasRefreshToken } from '../utils/cookie.utils';
import userRoleService from "../services/user-role.service.ts";


interface AuthState {
    // State
    accessToken: string | null;
    isAuthenticated: boolean;
    userRoles: UserRoleResponse[];
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setAccessToken: (token: string | null) => void;
    setUserRoles: (roles: UserRoleResponse[]) => void;
    setError: (error: string | null) => void;
    
    // Role helpers
    hasRole: (role: string) => boolean;
    isManager: () => boolean;
    isGlobalManager: () => boolean;
    isDepartmentManager: (departmentId?: number) => boolean;
    canAccessDepartment: (departmentId: number, userDepartmentId?: number) => boolean;
    canAccessAllProjectsInDepartment: (departmentId: number, userDepartmentId?: number) => boolean;
    
    // Role fetching
    fetchUserRoles: () => Promise<void>;
    
    // Auth actions
    logout: () => void;
    clearAuth: () => void;
    setLoading: (loading: boolean) => void;
    checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Initial state
            accessToken: null,
            isAuthenticated: false,
            userRoles: [],
            isLoading: true,
            error: null,

            // Basic setters
            setAccessToken: (token) => {
                console.log("setAccessToken", token);
                const isAuthenticated = !!token;
                
                set({ 
                    accessToken: token, 
                    isAuthenticated,
                    error: null
                });
                
                if (!isAuthenticated) {
                    set({ userRoles: [] });
                }
            },

            setUserRoles: (roles) => {
                set({ userRoles: roles });
            },

            setError: (error) => {
                set({ error });
            },

            // Role management
            hasRole: (role: string) => {
                const userRoles = get().userRoles;
                return userRoles.some(userRole => 
                    userRole.role.name.toLowerCase().includes(role.toLowerCase())
                );
            },

            isManager: () => {
                return get().hasRole('manager') || get().hasRole('admin') || get().hasRole('lead');
            },

            isGlobalManager: () => {
                const userRoles = get().userRoles;
                return userRoles.some(userRole => 
                    userRole.role.name.toLowerCase().includes('manager') && 
                    userRole.scope === 'GLOBAL'
                );
            },

            isDepartmentManager: (departmentId?: number) => {
                if (get().isGlobalManager()) return true;
                const userRoles = get().userRoles;
                return userRoles.some(userRole => 
                    userRole.role.name.toLowerCase().includes('manager') && 
                    userRole.scope === 'DEPARTMENT' &&
                    (!departmentId || userRole.scopeId === departmentId)
                );
            },

            canAccessDepartment: (departmentId: number, userDepartmentId?: number) => {
                // Global managers can access all departments
                if (get().isGlobalManager()) return true;

                // Department managers can access their own department
                if (get().isDepartmentManager(departmentId)) return true;

                // Regular users can only access their own department
                return userDepartmentId === departmentId;
            },

            canAccessAllProjectsInDepartment: (departmentId: number) => {
                // Global managers can access all projects
                if (get().isGlobalManager()) return true;

                // Department managers can access all projects in their department
                if (get().isDepartmentManager(departmentId)) return true;

                // Regular users can only access their own projects
                return false;
            },

            // Data fetching
            fetchUserRoles: async () => {
                try {
                    const data = await userRoleService.getMyRoles()
                    // Check if response follows FlowXResponse pattern
                    if (data) {
                        if (data.code === 200 || data.code === 201) {
                            const roles = data.data || [];
                            set({ userRoles: roles, error: null });
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch user roles:', error);
                    if (axios.isAxiosError(error) && error.response) {
                        console.error('Error response:', error.response.data);
                        console.error('Error status:', error.response.status);
                    }
                }
            },
            // Auth actions
            clearAuth: () => {
                set({ 
                    accessToken: null, 
                    isAuthenticated: false, 
                    userRoles: [],
                    error: null
                });
            },

            logout: () => {
                get().clearAuth();
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            checkAuthStatus: async () => {
                if (!get().isLoading) return;

                const accessToken = get().accessToken;
                
                // If no token but have refresh token cookie, try to refresh
                if (!accessToken && hasRefreshToken()) {
                    try {
                        // The API service interceptor will handle refresh automatically
                        // We just need to make a test request to trigger it
                        await get().fetchUserRoles();
                        set({ isLoading: false });
                        return;
                    } catch (error) {
                        console.error('Failed to refresh token on startup:', error);
                        get().clearAuth();
                        set({ isLoading: false });
                        return;
                    }
                }
                
                // If no token and no refresh token, not authenticated
                if (!accessToken) {
                    set({ 
                        isAuthenticated: false,
                        isLoading: false 
                    });
                    return;
                }

                // Validate token format and expiration
                if (!isValidJWTFormat(accessToken) || isJWTExpired(accessToken)) {
                    // Token is invalid or expired, but check if we have refresh token
                    if (hasRefreshToken()) {
                        try {
                            // The API service will handle refresh automatically
                            await get().fetchUserRoles();
                            set({ isLoading: false });
                            return;
                        } catch (error) {
                            console.error('Failed to refresh expired token:', error);
                        }
                    }
                    
                    // No refresh token or refresh failed
                    get().clearAuth();
                    set({ isLoading: false });
                    return;
                }

                // Token exists and not expired - assume authenticated
                set({ 
                    isAuthenticated: true, 
                    isLoading: false,
                    error: null
                });
                
                // Try to fetch user roles if we don't have them
                // This will validate token against real API
                const { userRoles } = get();
                if (userRoles.length === 0) {
                    try {
                        await get().fetchUserRoles();
                    } catch (error) {
                        // If API call fails, token might be invalid
                        console.error('Token validation failed:', error);
                        get().clearAuth();
                        set({ isLoading: false });
                    }
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ 
                accessToken: state.accessToken,
                userRoles: state.userRoles
            }),
        }
    )
);

// Export specific actions for convenience
export const { setAccessToken, setUserRoles, clearAuth, setLoading, checkAuthStatus } = useAuthStore.getState();