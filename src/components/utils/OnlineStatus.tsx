import React from 'react';
import { useUserPresence } from '../../hooks/useUserPresence';

interface OnlineStatusProps {
  userId: string | number;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dot' | 'badge' | 'text';
  className?: string;
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({
  userId,
  showText = false,
  size = 'md',
  variant = 'dot',
  className = ''
}) => {
  const { isUserOnline } = useUserPresence();
  const online = isUserOnline(userId);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return variant === 'dot' ? 'w-2 h-2' : 'text-xs px-1.5 py-0.5';
      case 'lg':
        return variant === 'dot' ? 'w-4 h-4' : 'text-sm px-2 py-1';
      default:
        return variant === 'dot' ? 'w-3 h-3' : 'text-xs px-1.5 py-0.5';
    }
  };

  const getStatusClasses = () => {
    if (online) {
      return variant === 'dot' 
        ? 'bg-green-500' 
        : 'bg-green-100 text-green-800 border-green-200';
    } else {
      return variant === 'dot' 
        ? 'bg-gray-300' 
        : 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    return online ? 'Online' : 'Offline';
  };

  if (variant === 'text') {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <div className={`rounded-full mr-1.5 ${getSizeClasses()} ${getStatusClasses()}`}></div>
        {showText && <span className="text-sm text-gray-600">{getStatusText()}</span>}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <span className={`inline-flex items-center rounded-full border ${getSizeClasses()} ${getStatusClasses()} ${className}`}>
        <div className={`rounded-full mr-1 ${size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'} ${online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        {showText && getStatusText()}
      </span>
    );
  }

  // Default dot variant
  return (
    <div className={`rounded-full ${getSizeClasses()} ${getStatusClasses()} ${className}`}></div>
  );
};

interface OnlineCountProps {
  className?: string;
  prefix?: string;
}

export const OnlineCount: React.FC<OnlineCountProps> = ({ 
  className = '',
  prefix = 'Online:' 
}) => {
  const { getOnlineCount } = useUserPresence();
  const count = getOnlineCount();

  return (
    <span className={`text-sm text-gray-600 ${className}`}>
      {prefix} <span className="font-medium text-green-600">{count}</span>
    </span>
  );
};

interface OnlineUsersListProps {
  userIds: (string | number)[];
  renderUser?: (userId: string | number, isOnline: boolean) => React.ReactNode;
  className?: string;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  userIds,
  renderUser,
  className = ''
}) => {
  const { isUserOnline } = useUserPresence();

  if (renderUser) {
    return (
      <div className={className}>
        {userIds.map(userId => renderUser(userId, isUserOnline(userId)))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {userIds.map(userId => (
        <div key={userId} className="flex items-center space-x-2">
          <OnlineStatus userId={userId} />
          <span className="text-sm">{userId}</span>
        </div>
      ))}
    </div>
  );
}; 