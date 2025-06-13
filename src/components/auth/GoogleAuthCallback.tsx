import React, { useEffect, useState } from 'react';
import authService from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth-store';
import { enhancedLogin } from '../../utils/auth-flow.utils';
import { useNavigationActions } from '../../utils/navigation.utils';

export const GoogleAuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { navigate, handleGoToLogin } = useNavigationActions();
  const { setAccessToken } = useAuthStore();

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
        
        // Authenticate with the backend using the enhanced login flow
        await enhancedLogin(
          () => authService.authenticateWithGoogle(idToken),
          setAccessToken,
          {
            delayBetweenActions: 500,
            onProgress: (step) => {
              console.log('Google auth progress:', step);
            },
            onError: (error) => {
              console.error('Google auth flow error:', error);
            }
          }
        );
        
        console.log('Google authentication successful!');
        
        // Small delay before navigation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
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
  }, [navigate, setAccessToken]);
  
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8"
         style={{
           background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
         }}>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-70 animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/30 p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl animate-pulse"
                   style={{
                     background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                   }}>
                <span className="text-white text-2xl font-bold">F</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              FlowX
            </h1>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {error ? 'Xác thực thất bại' : 'Đang xử lý xác thực...'}
            </h2>
            {!error && (
              <p className="text-gray-600 text-sm">
                Vui lòng đợi trong giây lát
              </p>
            )}
          </div>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
                <p className="text-red-600 text-xs mt-1">Đang chuyển hướng về trang đăng nhập...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              {/* Custom loading spinner with FlowX gradient */}
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                     style={{
                       borderTopColor: '#3B82F6',
                       borderRightColor: '#8B5CF6',
                       borderBottomColor: '#EC4899'
                     }}>
                </div>
                <div className="absolute inset-2 rounded-full flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                     }}>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Loading text with animation */}
              <div className="text-center">
                <p className="text-gray-700 text-base font-medium mb-2">
                  Đang xác thực tài khoản
                </p>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};