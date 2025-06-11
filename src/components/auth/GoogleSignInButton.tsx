import React, { useRef, useEffect, useState } from 'react';
import googleAuthService from '../../services/google-auth.service.ts';

interface GoogleSignInButtonProps {
  onSuccess: (data: { idToken: string; user: any }) => void;
  onError: (error: Error) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  className?: string;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'rectangular',
  className = '',
  disabled = false
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const initializeButton = async () => {
      if (!googleAuthService.isAvailable()) {
        console.warn('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in environment variables.');
        return;
      }

      try {
        setIsLoading(true);

        // Listen for Google sign-in events
        const handleGoogleSignIn = (event: CustomEvent) => {
          onSuccess(event.detail);
        };

        window.addEventListener('googleSignIn' as any, handleGoogleSignIn);

        // Render Google button
        if (buttonRef.current) {
          await googleAuthService.renderSignInButton(buttonRef.current, {
            theme,
            size,
            text,
            shape
          });
          setIsAvailable(true);
        }

        // Cleanup listener
        return () => {
          window.removeEventListener('googleSignIn' as any, handleGoogleSignIn);
        };
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        onError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeButton();
  }, [onSuccess, onError, theme, size, text, shape]);

  const handleManualSignIn = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      // Use redirect instead of popup
      await googleAuthService.signInWithRedirect();
      // Note: onSuccess won't be called here as the page will redirect
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      onError(error as Error);
      setIsLoading(false);
    }
  };

  if (!googleAuthService.isAvailable()) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-yellow-700">
            Google OAuth not configured. Please contact administrator.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Google-rendered button */}
      <div 
        ref={buttonRef} 
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
        style={{ minHeight: size === 'large' ? '44px' : size === 'medium' ? '36px' : '28px' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Fallback button if Google button fails to render */}
      {!isAvailable && !isLoading && (
        <button
          onClick={handleManualSignIn}
          disabled={disabled}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {text === 'signin_with' ? 'Sign in with Google' :
           text === 'signup_with' ? 'Sign up with Google' :
           text === 'continue_with' ? 'Continue with Google' :
           'Sign in'}
        </button>
      )}
    </div>
  );
}; 
