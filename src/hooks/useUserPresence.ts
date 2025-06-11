import { useState, useEffect, useCallback } from 'react';
import userPresenceService from '../services/user-presence.service';
import type { UserPresenceEvent } from '../types/user-presence';

interface UseUserPresenceReturn {
    onlineUsers: Set<string>;
    isUserOnline: (userId: string | number) => boolean;
    getOnlineCount: () => number;
    getOnlineUsers: () => string[];
    lastPresenceEvent: UserPresenceEvent | null;
    refreshOnlineUsers: () => void;
}

export const useUserPresence = (): UseUserPresenceReturn => {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [lastPresenceEvent, setLastPresenceEvent] = useState<UserPresenceEvent | null>(null);

    useEffect(() => {
        // Initialize the service
        userPresenceService.init();

        // Subscribe to presence changes
        const unsubscribe = userPresenceService.onPresenceChange((users, event) => {
            setOnlineUsers(new Set(users));
            if (event) {
                setLastPresenceEvent(event);
            }
        });

        // Cleanup on unmount
        return () => {
            unsubscribe();
        };
    }, []);

    const isUserOnline = useCallback((userId: string | number): boolean => {
        return userPresenceService.isUserOnline(userId);
    }, []);

    const getOnlineCount = useCallback((): number => {
        return userPresenceService.getOnlineCount();
    }, []);

    const getOnlineUsers = useCallback((): string[] => {
        return userPresenceService.getOnlineUsers();
    }, []);

    const refreshOnlineUsers = useCallback(() => {
        userPresenceService.requestOnlineUsers();
    }, []);

    return {
        onlineUsers,
        isUserOnline,
        getOnlineCount,
        getOnlineUsers,
        lastPresenceEvent,
        refreshOnlineUsers
    };
}; 