import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse, UserUpdateRequest } from '../types/user';
import { useAuthStore } from './auth-store';
import userService from '../services/user.service';

interface ProfileState {
    // State
    user: UserResponse | null;
    otherProfiles: Record<number, UserResponse>; // userId -> UserResponse
    isLoading: boolean;
    loadingOtherProfiles: Record<number, boolean>; // userId -> loading state
    error: string | null;
    
    // Actions
    setUser: (user: UserResponse | null) => void;
    setOtherProfile: (userId: number, user: UserResponse) => void;
    setLoading: (loading: boolean) => void;
    setLoadingOtherProfile: (userId: number, loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchProfile: () => Promise<void>;
    fetchOtherProfile: (userId: number, forceRefresh?: boolean) => Promise<UserResponse | null>;
    updateProfile: (request: UserUpdateRequest) => Promise<void>;
    
    // Convenience methods
    getOtherProfile: (userId: number, forceRefresh?: boolean) => Promise<UserResponse | null>;
    getMultipleProfiles: (userIds: number[], forceRefresh?: boolean) => Promise<Record<number, UserResponse>>;
    
    // Cache utilities
    clearProfile: () => void;
    clearOtherProfile: (userId: number) => void;
    clearAllOtherProfiles: () => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            otherProfiles: {},
            isLoading: false,
            loadingOtherProfiles: {},
            error: null,

            // Actions
            setUser: (user) => {
                set({ user, error: null });
            },

            setOtherProfile: (userId, user) => {
                set(state => ({
                    otherProfiles: { ...state.otherProfiles, [userId]: user },
                    loadingOtherProfiles: { ...state.loadingOtherProfiles, [userId]: false }
                }));
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setLoadingOtherProfile: (userId, loading) => {
                set(state => ({
                    loadingOtherProfiles: { ...state.loadingOtherProfiles, [userId]: loading }
                }));
            },

            setError: (error) => {
                set({ error });
            },

            // Data fetching
            fetchProfile: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await userService.getMyProfile();
                    
                    if (response.data) {
                        set({ user: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            updateProfile: async (request: UserUpdateRequest) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await userService.updateMyProfile(request);
                    
                    if (response.data) {
                        set({ user: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
                    set({ error: errorMessage, isLoading: false });
                    throw error; // Re-throw so UI can handle the error
                }
            },

            // Fetch other user profile with caching
            fetchOtherProfile: async (userId, forceRefresh = false) => {
                const state = get();
                
                // Return cached data if available and not forcing refresh
                if (!forceRefresh && state.otherProfiles[userId] && !state.loadingOtherProfiles[userId]) {
                    return state.otherProfiles[userId];
                }

                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return null;
                }

                try {
                    get().setLoadingOtherProfile(userId, true);
                    set({ error: null });
                    
                    const response = await userService.getUserById(userId);
                    
                    if (response.data) {
                        get().setOtherProfile(userId, response.data);
                        return response.data;
                    }
                    return null;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
                    set(state => ({
                        error: errorMessage,
                        loadingOtherProfiles: { ...state.loadingOtherProfiles, [userId]: false }
                    }));
                    return null;
                }
            },

            clearProfile: () => {
                set({ user: null, error: null, isLoading: false });
            },

            clearOtherProfile: (userId) => {
                set(state => {
                    const { [userId]: removed, ...restProfiles } = state.otherProfiles;
                    const { [userId]: removedLoading, ...restLoading } = state.loadingOtherProfiles;
                    
                    return {
                        otherProfiles: restProfiles,
                        loadingOtherProfiles: restLoading,
                    };
                });
            },

            clearAllOtherProfiles: () => {
                set({ otherProfiles: {}, loadingOtherProfiles: {} });
            },

            // Convenience method - alias for fetchOtherProfile
            getOtherProfile: async (userId, forceRefresh = false) => {
                return get().fetchOtherProfile(userId, forceRefresh);
            },

            // Bulk operations for other profiles
            getMultipleProfiles: async (userIds, forceRefresh = false) => {
                const state = get();
                const results: Record<number, UserResponse> = {};
                const idsToFetch: number[] = [];

                // Check which profiles we already have cached
                for (const userId of userIds) {
                    if (!forceRefresh && state.otherProfiles[userId] && !state.loadingOtherProfiles[userId]) {
                        results[userId] = state.otherProfiles[userId];
                    } else {
                        idsToFetch.push(userId);
                    }
                }

                // If all profiles are cached, return them
                if (idsToFetch.length === 0) {
                    return results;
                }

                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return results;
                }

                try {
                    // Set loading state for all profiles we're fetching
                    idsToFetch.forEach(userId => {
                        get().setLoadingOtherProfile(userId, true);
                    });
                    set({ error: null });

                    // Fetch all profiles in parallel
                    const fetchPromises = idsToFetch.map(userId => 
                        userService.getUserById(userId).then(response => ({
                            userId,
                            response
                        })).catch(error => ({
                            userId,
                            error
                        }))
                    );

                    const fetchResults = await Promise.all(fetchPromises);

                    // Process results
                    fetchResults.forEach(result => {
                        if ('response' in result && result.response.data) {
                            const user = result.response.data;
                            get().setOtherProfile(result.userId, user);
                            results[result.userId] = user;
                        } else {
                            // Set loading to false for failed requests
                            set(state => ({
                                loadingOtherProfiles: { ...state.loadingOtherProfiles, [result.userId]: false }
                            }));
                        }
                    });

                    return results;
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || 'Failed to fetch profiles';
                    set(state => {
                        const updatedLoading = { ...state.loadingOtherProfiles };
                        idsToFetch.forEach(userId => {
                            updatedLoading[userId] = false;
                        });
                        
                        return {
                            error: errorMessage,
                            loadingOtherProfiles: updatedLoading
                        };
                    });
                    return results;
                }
            }
        }),
        {
            name: 'profile-storage',
            partialize: (state) => ({ 
                user: state.user,
                otherProfiles: state.otherProfiles
            }),
        }
    )
); 