import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../stores/notification-store';
import type { NotificationResponse } from '../types/notification';
import { Bell } from 'lucide-react';

interface NotificationDropdownProps {
    className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearError
    } = useNotificationStore();

    useEffect(() => {
        // Fetch notifications when component mounts
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: NotificationResponse) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        
        // Handle navigation based on entityType and entityId
        if (notification.entityType && notification.entityId) {
            // Add navigation logic here
            console.log('Navigate to:', notification.entityType, notification.entityId);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (error) {
            clearError();
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                
                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading && (
                            <div className="flex items-center justify-center p-6">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 text-sm text-red-600 bg-red-50">
                                {error}
                            </div>
                        )}

                        {!isLoading && !error && notifications.length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                <p>No notifications yet</p>
                            </div>
                        )}

                        {!isLoading && !error && notifications.length > 0 && (
                            <div className="divide-y divide-gray-200">
                                {notifications.slice(0, 10).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 10 && (
                        <div className="px-4 py-3 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to notifications page
                                    window.location.href = '/notifications';
                                }}
                                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface NotificationItemProps {
    notification: NotificationResponse;
    onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClick }) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

    return (
        <div
            onClick={onClick}
            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                !notification.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
        >
            <div className="flex items-start space-x-3">
                {/* Icon based on entity type */}
                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                        !notification.isRead ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                        {notification.title}
                    </p>
                    
                    {notification.content && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {notification.content}
                        </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                        {timeAgo}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationDropdown; 