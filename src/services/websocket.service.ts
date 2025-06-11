import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { NotificationResponse } from '../types/notification';
import {envConfig} from "../configs/env.config.ts";
import { useAuthStore } from '../stores/auth-store';

type NotificationCallback = (notification: NotificationResponse) => void;

class WebSocketService {
    private client: Client | null = null;
    private connected = false;
    private notificationCallbacks: NotificationCallback[] = [];
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;

    constructor() {
        this.client = new Client({
            webSocketFactory: () => new SockJS(`${envConfig.be.url}/ws/notification`),
            connectHeaders: {},
            debug: (str) => {
                if (import.meta.env.DEV) {
                    console.log('STOMP: ' + str);
                }
            },
            reconnectDelay: this.reconnectDelay,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        this.client.onConnect = () => {
            this.connected = true;
            this.reconnectAttempts = 0;
            this.subscribeToUserNotifications();
        };

        this.client.onDisconnect = () => {
            this.connected = false;
        };

        this.client.onStompError = (frame) => {
            this.handleReconnect();
        };

        this.client.onWebSocketError = (error) => {
            this.handleReconnect();
        };
    }

    connect(token?: string) {
        if (token) {
            this.client!.connectHeaders = {
                Authorization: `Bearer ${token}`
            };
        }
        
        if (!this.connected && this.client) {
            this.client.activate();
        }
    }

    disconnect() {
        if (this.client && this.connected) {
            this.client.deactivate();
            this.connected = false;
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    private subscribeToUserNotifications() {
        const userId = this.getUserId();
        if (!userId || !this.client) {
            return;
        }

        const topic = `/topic/notifications/${userId}`;
        
        this.client.subscribe(topic, (message) => {
            try {
                const notification: NotificationResponse = JSON.parse(message.body);
                this.notificationCallbacks.forEach(callback => callback(notification));
            } catch (error) {
                console.error('Error parsing notification:', error);
            }
        });
    }

    onNotificationReceived(callback: NotificationCallback) {
        this.notificationCallbacks.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.notificationCallbacks.indexOf(callback);
            if (index > -1) {
                this.notificationCallbacks.splice(index, 1);
            }
        };
    }

    private getUserId(): string | null {
        // Try to get from auth store first
        try {
            const authState = useAuthStore.getState();
            if (authState.accessToken) {
                // Decode JWT to get user ID
                const payload = JSON.parse(atob(authState.accessToken.split('.')[1]));
                return payload.userId?.toString() || payload.sub || payload.id?.toString();
            }
        } catch (error) {
            // Silently fail
        }

        // Fallback to localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.id?.toString();
            } catch {
                return null;
            }
        }
        return null;
    }

    isConnected(): boolean {
        return this.connected;
    }

    // Generic subscribe method for any topic
    subscribe(topic: string, callback: (message: any) => void) {
        if (!this.client || !this.connected) {
            console.warn('WebSocket not connected, cannot subscribe to', topic);
            return;
        }

        return this.client.subscribe(topic, callback);
    }

    // Generic send method for any destination
    send(destination: string, body: any = {}) {
        if (!this.client || !this.connected) {
            console.warn('WebSocket not connected, cannot send to', destination);
            return;
        }

        this.client.publish({
            destination,
            body: JSON.stringify(body)
        });
    }

}

export default new WebSocketService(); 