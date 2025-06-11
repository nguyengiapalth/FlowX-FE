import type { UserPresenceEvent, PresenceCallback } from '../types/user-presence';
import webSocketService from './websocket.service';

class UserPresenceService {
    private onlineUsers = new Set<string>();
    private callbacks: PresenceCallback[] = [];
    private heartbeatInterval: number | null = null;
    private isInitialized = false;
    private presenceSubscription: any = null;
    private onlineUsersSubscription: any = null;
    
    init() {
        if (this.isInitialized) {
            return;
        }

        // Subscribe to presence updates and online users list
        this.subscribeToPresenceUpdates();
        this.subscribeToOnlineUsersList();
        
        // Start heartbeat
        this.startHeartbeat();
        
        this.isInitialized = true;
    }
    
    private subscribeToPresenceUpdates() {
        // Wait for WebSocket connection
        const waitForConnection = () => {
            if (webSocketService.isConnected()) {
                this.setupPresenceSubscription();
            } else {
                setTimeout(waitForConnection, 1000);
            }
        };
        
        waitForConnection();
    }
    
    private subscribeToOnlineUsersList() {
        // Wait for WebSocket connection
        const waitForConnection = () => {
            if (webSocketService.isConnected()) {
                this.setupOnlineUsersSubscription();
            } else {
                setTimeout(waitForConnection, 1000);
            }
        };
        
        waitForConnection();
    }
    
    private setupPresenceSubscription() {
        try {
            // Subscribe to user presence topic
            this.presenceSubscription = webSocketService.subscribe('/topic/user.presence', (message) => {
                try {
                    const presence: UserPresenceEvent = JSON.parse(message.body);
                    this.handlePresenceUpdate(presence);
                } catch (error) {
                    console.error('Error parsing presence update:', error);
                }
            });
            
        } catch (error) {
            console.error('Error setting up presence subscription:', error);
        }
    }
    
    private setupOnlineUsersSubscription() {
        try {
            // Subscribe to personal queue for online users list
            this.onlineUsersSubscription = webSocketService.subscribe('/user/queue/online-users', (message) => {
                try {
                    const onlineUserIds: string[] = JSON.parse(message.body);
                    this.handleOnlineUsersList(onlineUserIds);
                } catch (error) {
                    console.error('Error parsing online users list:', error);
                }
            });
            
            // Request current online users after subscription
            setTimeout(() => {
                this.requestOnlineUsers();
            }, 500);
            
        } catch (error) {
            console.error('Error setting up online users subscription:', error);
        }
    }
    
    private handleOnlineUsersList(userIds: string[]) {
        // Update the entire online users set
        this.onlineUsers = new Set(userIds);
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(new Set(this.onlineUsers));
            } catch (error) {
                console.error('Error in presence callback:', error);
            }
        });
    }
    
    private handlePresenceUpdate(presence: UserPresenceEvent) {
        const userId = presence.userId.toString();
        
        if (presence.status === 'ONLINE') {
            this.onlineUsers.add(userId);
        } else {
            this.onlineUsers.delete(userId);
        }
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
            try {
                callback(new Set(this.onlineUsers), presence);
            } catch (error) {
                console.error('Error in presence callback:', error);
            }
        });
    }
    
    private startHeartbeat() {
        // Clear existing interval if any
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        this.heartbeatInterval = setInterval(() => {
            try {
                if (webSocketService.isConnected()) {
                    webSocketService.send('/app/user.heartbeat', {});
                }
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        }, 60000); // Every minute
    }
    
    onPresenceChange(callback: PresenceCallback): () => void {
        this.callbacks.push(callback);
        
        // Immediately call with current state
        callback(new Set(this.onlineUsers));
        
        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }
    
    isUserOnline(userId: string | number): boolean {
        return this.onlineUsers.has(userId.toString());
    }
    
    getOnlineUsers(): string[] {
        return Array.from(this.onlineUsers);
    }
    
    getOnlineCount(): number {
        return this.onlineUsers.size;
    }
    
    // Manual refresh - request current online users
    requestOnlineUsers() {
        try {
            if (webSocketService.isConnected()) {
                webSocketService.send('/app/user.getOnlineUsers', {});
            }
        } catch (error) {
            console.error('Error requesting online users:', error);
        }
    }
    
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        
        if (this.presenceSubscription) {
            try {
                this.presenceSubscription.unsubscribe();
            } catch (error) {
                console.error('Error unsubscribing from presence topic:', error);
            }
            this.presenceSubscription = null;
        }
        
        if (this.onlineUsersSubscription) {
            try {
                this.onlineUsersSubscription.unsubscribe();
            } catch (error) {
                console.error('Error unsubscribing from online users topic:', error);
            }
            this.onlineUsersSubscription = null;
        }
        
        this.callbacks = [];
        this.onlineUsers.clear();
        this.isInitialized = false;
    }
    
    // Reconnect functionality
    reconnect() {
        this.cleanup();
        setTimeout(() => {
            this.init();
        }, 1000);
    }
    
    // Debug method
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            onlineUsers: Array.from(this.onlineUsers),
            callbackCount: this.callbacks.length,
            hasHeartbeat: !!this.heartbeatInterval,
            hasPresenceSubscription: !!this.presenceSubscription,
            hasOnlineUsersSubscription: !!this.onlineUsersSubscription,
            isWebSocketConnected: webSocketService.isConnected()
        };
    }
}

export const userPresenceService = new UserPresenceService();
export default userPresenceService; 