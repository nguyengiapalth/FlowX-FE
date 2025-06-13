/**
 * Auth flow utilities to handle post-login actions with proper sequencing and delays
 */

import React from 'react';
import { useAuthStore } from '../stores/auth-store';
import { useProfileStore } from '../stores/profile-store';
import { useDepartmentStore } from '../stores/department-store';
import { useProjectStore } from '../stores/project-store';

interface PostLoginFlowOptions {
  delayBetweenActions?: number;
  includeProfile?: boolean;
  includeDepartments?: boolean;
  includeProjects?: boolean;
  onProgress?: (step: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Execute post-login data fetching flow with proper sequencing
 */
export const executePostLoginFlow = async (options: PostLoginFlowOptions = {}) => {
  const {
    delayBetweenActions = 300, // 300ms delay between actions
    includeProfile = true,
    includeDepartments = true,
    includeProjects = true,
    onProgress,
    onError
  } = options;

  const { fetchUserRoles, isGlobalManager } = useAuthStore.getState();
  const { fetchProfile } = useProfileStore.getState();
  const { fetchDepartments } = useDepartmentStore.getState();
  const { fetchMyProjects } = useProjectStore.getState();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Step 1: Fetch user roles first (most important)
    onProgress?.('Đang tải thông tin vai trò...');
    await fetchUserRoles();
    await delay(delayBetweenActions);

    // Step 2: Fetch profile
    if (includeProfile) {
      onProgress?.('Đang tải thông tin cá nhân...');
      await fetchProfile();
      await delay(delayBetweenActions);
    }

    // Step 3: Fetch departments (for global managers) or projects (for others)
    if (isGlobalManager()) {
      if (includeDepartments) {
        onProgress?.('Đang tải danh sách phòng ban...');
        await fetchDepartments();
        await delay(delayBetweenActions);
      }
    } else {
      if (includeProjects) {
        onProgress?.('Đang tải dự án của bạn...');
        await fetchMyProjects();
        await delay(delayBetweenActions);
      }
    }

    onProgress?.('Hoàn tất!');
    
  } catch (error) {
    console.error('Error in post-login flow:', error);
    onError?.(error as Error);
    throw error;
  }
};

/**
 * Hook to get post-login flow with loading state
 */
export const usePostLoginFlow = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  const executeFlow = async (options?: PostLoginFlowOptions) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('');

    try {
      await executePostLoginFlow({
        ...options,
        onProgress: (step) => {
          setCurrentStep(step);
          options?.onProgress?.(step);
        },
        onError: (err) => {
          setError(err.message);
          options?.onError?.(err);
        }
      });
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  return {
    executeFlow,
    isLoading,
    currentStep,
    error
  };
};

/**
 * Enhanced login function with proper flow
 */
export const enhancedLogin = async (
  loginFn: () => Promise<any>, 
  setAccessToken: (token: string) => void,
  options?: PostLoginFlowOptions
) => {
  try {
    // Step 1: Execute login
    const response = await loginFn();
    
    if (response.data && response.data.authenticated) {
      // Step 2: Set token with small delay to ensure it's properly set
      setAccessToken(response.data.token);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 3: Execute post-login flow
      await executePostLoginFlow(options);
      
      return response;
    } else {
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  } catch (error) {
    console.error('Enhanced login error:', error);
    throw error;
  }
  }; 