import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserResponse, UserUpdateRequest } from '../types/user';
import { useAuthStore } from './auth-store';
import userService from '../services/user.service';

interface ProfileState {
    // State
    user: UserResponse | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    setUser: (user: UserResponse | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchProfile: () => Promise<void>;
    updateProfile: (request: UserUpdateRequest) => Promise<void>;
    clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            isLoading: false,
            error: null,

            // Actions
            setUser: (user) => {
                set({ user, error: null });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
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

            clearProfile: () => {
                set({ user: null, error: null, isLoading: false });
            }
        }),
        {
            name: 'profile-storage',
            partialize: (state) => ({ 
                user: state.user
            }),
        }
    )
); 