import React, { useEffect, useState } from 'react';
import { useNotificationStore } from '../stores/notification-store';
import type { NotificationResponse } from '../types/notification';
import { Bell, X } from 'lucide-react';

interface ToastNotificationProps {
  className?: string;
}

interface ToastItem {
  id: string;
  notification: NotificationResponse;
  timestamp: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ className = '' }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { newNotifications, clearNewNotifications } = useNotificationStore();

  useEffect(() => {
    // Process new notifications from store
    if (newNotifications.length > 0) {
      newNotifications.forEach(notification => {
        if (!notification.isRead) {
          const toastId = `toast-${notification.id}-${Date.now()}`;
          const newToast: ToastItem = {
            id: toastId,
            notification,
            timestamp: Date.now()
          };

          setToasts(prev => {
            // Avoid duplicate toasts for the same notification
            const exists = prev.some(toast => 
              toast.notification.id === notification.id
            );
            if (exists) return prev;
            return [...prev, newToast];
          });

          // Auto remove toast after 5 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== toastId));
          }, 5000);
        }
      });

      // Clear the new notifications from store after processing
      clearNewNotifications();
    }
  }, [newNotifications, clearNewNotifications]);

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleToastClick = (notification: NotificationResponse) => {
    // Handle navigation based on notification type
    if (notification.entityType && notification.entityId) {
      switch (notification.entityType) {
        case 'TASK':
          window.location.href = `/tasks/${notification.entityId}`;
          break;
        case 'PROJECT':
          window.location.href = `/project/${notification.entityId}`;
          break;
        case 'DEPARTMENT':
          window.location.href = `/department/${notification.entityId}`;
          break;
        default:
          window.location.href = '/newsfeed';
      }
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
          onClick={() => handleToastClick(toast.notification)}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: ToastItem;
  onRemove: () => void;
  onClick: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300); // Wait for exit animation
  };

  const handleClick = () => {
    onClick();
    handleRemove();
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm cursor-pointer
        hover:shadow-xl hover:scale-105
      `}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
            {toast.notification.title}
          </p>
          {toast.notification.content && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {toast.notification.content}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Nhấn để xem chi tiết
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all ease-linear"
          style={{ 
            width: '100%',
            animation: 'toast-progress 5s linear forwards',
          }}
        />
      </div>
    </div>
  );
};

export default ToastNotification; 