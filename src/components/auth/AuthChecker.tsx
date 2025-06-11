import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store.ts';
import { useNotificationStore } from '../../stores/notification-store';
import userPresenceService from '../../services/user-presence.service';

interface AuthCheckerProps {
  children: React.ReactNode;
}

export const AuthChecker: React.FC<AuthCheckerProps> = ({ children }) => {
  const { checkAuthStatus, isLoading, isAuthenticated, accessToken } = useAuthStore();
  const { connectWebSocket, disconnectWebSocket, reset: resetNotifications } = useNotificationStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Handle WebSocket connection based on authentication status
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Request notification permission
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      // Connect to WebSocket
      connectWebSocket(accessToken);
      
      // Initialize user presence service after WebSocket connection
      setTimeout(() => {
        userPresenceService.init();
      }, 1000);
    } else {
      // Disconnect WebSocket and reset notifications when not authenticated
      disconnectWebSocket();
      resetNotifications();
      
      // Cleanup user presence service
      userPresenceService.cleanup();
    }

    // Cleanup on unmount
    return () => {
      disconnectWebSocket();
      userPresenceService.cleanup();
    };
  }, [isAuthenticated, accessToken, connectWebSocket, disconnectWebSocket, resetNotifications]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-white text-2xl font-bold">F</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">FlowX</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-gray-600 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 