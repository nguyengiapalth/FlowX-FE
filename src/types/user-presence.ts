export interface UserPresenceEvent {
  userId: number;
  status: 'ONLINE' | 'OFFLINE';
  timestamp: number;
  userEmail?: string;
  userName?: string;
}

export interface UserPresenceState {
  onlineUsers: Set<string>;
  lastUpdated: number;
}

export type PresenceCallback = (users: Set<string>, event?: UserPresenceEvent) => void; 