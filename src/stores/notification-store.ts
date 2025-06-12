import { create } from 'zustand';
import type { NotificationResponse } from '../types/notification';
import notificationService from '../services/notification.service';
import webSocketService from '../services/websocket.service';
import type { Page } from '../types/common';

interface NotificationState {
    notifications: NotificationResponse[];
    unreadCount: number;
    currentPage: number;
    totalPages: number;
    totalElements: number;
    isLoading: boolean;
    error: string | null;
    isWebSocketConnected: boolean;
    newNotifications: NotificationResponse[];

    // Actions
    fetchNotifications: (page?: number) => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAsUnread: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: NotificationResponse) => void;
    connectWebSocket: (token?: string) => void;
    disconnectWebSocket: () => void;
    clearError: () => void;
    clearNewNotifications: () => void;
    reset: () => void;
}

const initialState = {
    notifications: [],
    unreadCount: 0,
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    isLoading: false,
    error: null,
    isWebSocketConnected: false,
    newNotifications: [],
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
    ...initialState,

    fetchNotifications: async (page = 0) => {
        set({ isLoading: true, error: null });
        try {
            const response = await notificationService.getMyNotifications(page);
            if (response.code === 200 && response.data) {
                const pageData: Page<NotificationResponse> = response.data;
                const unreadCount = pageData.content.filter(n => !n.isRead).length;
                
                set({
                    notifications: page === 0 ? pageData.content : [...get().notifications, ...pageData.content],
                    unreadCount: page === 0 ? unreadCount : get().unreadCount,
                    currentPage: pageData.number,
                    totalPages: pageData.totalPages,
                    totalElements: pageData.totalElements,
                    isLoading: false
                });
            }
        } catch (error) {
            set({ 
                error: error instanceof Error ? error.message : 'Failed to fetch notifications',
                isLoading: false 
            });
        }
    },

    markAsRead: async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            set(state => ({
                notifications: state.notifications.map(n => 
                    n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to mark as read' });
        }
    },

    markAsUnread: async (id: number) => {
        try {
            await notificationService.markAsUnread(id);
            set(state => ({
                notifications: state.notifications.map(n => 
                    n.id === id ? { ...n, isRead: false, readAt: undefined } : n
                ),
                unreadCount: state.unreadCount + 1
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to mark as unread' });
        }
    },

    markAllAsRead: async () => {
        try {
            await notificationService.markAllAsRead();
            set(state => ({
                notifications: state.notifications.map(n => ({ 
                    ...n, 
                    isRead: true, 
                    readAt: new Date().toISOString() 
                })),
                unreadCount: 0
            }));
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to mark all as read' });
        }
    },

    addNotification: (notification: NotificationResponse) => {
        set(state => ({
            notifications: [notification, ...state.notifications],
            unreadCount: !notification.isRead ? state.unreadCount + 1 : state.unreadCount,
            totalElements: state.totalElements + 1,
            newNotifications: [notification, ...state.newNotifications]
        }));

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.content,
                icon: '/favicon.ico',
                tag: `notification-${notification.id}`
            });
        }
    },

    connectWebSocket: (token?: string) => {
        // Setup notification callback
        const unsubscribe = webSocketService.onNotificationReceived((notification) => {
            get().addNotification(notification);
        });

        // Connect to WebSocket
        webSocketService.connect(token);
        
        set({ isWebSocketConnected: true });

        // Store unsubscribe function for cleanup
        (window as any).__notificationUnsubscribe = unsubscribe;
    },

    disconnectWebSocket: () => {
        webSocketService.disconnect();
        
        // Cleanup subscription
        if ((window as any).__notificationUnsubscribe) {
            (window as any).__notificationUnsubscribe();
            delete (window as any).__notificationUnsubscribe;
        }
        
        set({ isWebSocketConnected: false });
    },

    clearError: () => set({ error: null }),

    clearNewNotifications: () => set({ newNotifications: [] }),

    reset: () => {
        get().disconnectWebSocket();
        set(initialState);
    }
})); 