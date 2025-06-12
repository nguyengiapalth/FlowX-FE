import React, { useEffect, useState } from 'react';
import authService from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth-store';
import { useProfileStore } from '../../stores/profile-store';
import { useDepartmentStore } from '../../stores/department-store';
import { useProjectStore } from '../../stores/project-store';
import { useNavigationActions } from '../../utils/navigation.utils';

export const GoogleAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { navigate, handleGoToLogin } = useNavigationActions();
  const { setAccessToken, fetchUserRoles, isGlobalManager } = useAuthStore();
  const { fetchProfile } = useProfileStore();
  const { fetchDepartments } = useDepartmentStore();
  const { fetchMyProjects } = useProjectStore();

  useEffect(() => {
    const processGoogleCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash.substring(1);
        
        // Parse the hash to get the tokens
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');
        
        if (!idToken) {
          throw new Error('No ID token found in the callback URL');
        }
        
        // Authenticate with the backend using the ID token
        const response = await authService.authenticateWithGoogle(idToken);
        
        if (response.data && response.data.authenticated) {
          setAccessToken(response.data.token);
          
          console.log('Google authentication successful!');
          
          // Fetch data after successful auth
          await fetchProfile();
          await fetchUserRoles();
          
          // Fetch role-based data
          if (isGlobalManager()) {
            await fetchDepartments();
          } else {
            await fetchMyProjects();
          }
          
          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          setError('Google authentication failed. Please try again.');
        }
      } catch (error: any) {
        console.error('Google auth callback error:', error);
        
        const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Google authentication failed. Please try again.';
        
        setError(errorMessage);
        
        // Redirect to login page after a delay
        setTimeout(() => {
          handleGoToLogin();
        }, 3000);
      }
    };
    
    processGoogleCallback();
  }, [navigate, setAccessToken, fetchProfile, fetchUserRoles, fetchDepartments, fetchMyProjects, isGlobalManager]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl border border-white/20 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">F</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">FlowX</h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error ? 'Authentication Failed' : 'Processing Authentication...'}
            </h2>
          </div>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600 text-sm">Please wait while we complete your authentication...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};