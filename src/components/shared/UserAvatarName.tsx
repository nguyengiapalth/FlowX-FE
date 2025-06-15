import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserResponse } from '../../types/user';

interface UserAvatarNameProps {
  user: UserResponse | {
    id: number;
    fullName: string;
    avatar?: string;
    position?: string;
    email?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPosition?: boolean;
  showEmail?: boolean;
  clickable?: boolean;
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  layout?: 'horizontal' | 'vertical';
}

const sizeConfig = {
  sm: {
    avatar: 'w-8 h-8',
    text: 'text-sm',
    spacing: 'space-x-2'
  },
  md: {
    avatar: 'w-10 h-10', 
    text: 'text-sm',
    spacing: 'space-x-3'
  },
  lg: {
    avatar: 'w-12 h-12',
    text: 'text-base',
    spacing: 'space-x-3'
  },
  xl: {
    avatar: 'w-16 h-16',
    text: 'text-lg',
    spacing: 'space-x-4'
  }
};

const getAvatarGradient = (name: string): string => {
  const gradients = [
    'from-primary-400 to-primary-600',
    'from-secondary-400 to-secondary-600', 
    'from-accent-400 to-accent-600',
    'from-primary-500 to-secondary-500',
    'from-secondary-500 to-accent-500',
    'from-accent-500 to-primary-500',
    'gradient-primary',
    'from-gray-400 to-gray-600'
  ];
  
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export const UserAvatarName: React.FC<UserAvatarNameProps> = ({
  user,
  size = 'md',
  showPosition = false,
  showEmail = false,
  clickable = true,
  className = '',
  avatarClassName = '',
  nameClassName = '',
  layout = 'horizontal'
}) => {
  const navigate = useNavigate();

  // Early return if user is null/undefined
  if (!user) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
        <span className="text-sm">Không có thông tin</span>
      </div>
    );
  }

  // Safe get fullName with fallback
  const userName = user.fullName || 'Unknown User';
  const userInitial = userName.charAt(0).toUpperCase() || '?';

  const handleClick = () => {
    if (clickable && user.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const config = sizeConfig[size];
  const isHorizontal = layout === 'horizontal';

  const baseClasses = isHorizontal 
    ? `flex items-start ${config.spacing} ${className}`
    : `flex flex-col items-center space-y-2 ${className}`;

  const containerClasses = clickable 
    ? `${baseClasses} cursor-pointer group transition-colors hover:bg-gray-50 rounded-lg p-1`
    : baseClasses;

  const textAlignClasses = isHorizontal ? 'text-left' : 'text-center';

  return (
    <div className={containerClasses} onClick={handleClick}>
      {/* Avatar */}
      <div className={`relative flex-shrink-0 ${avatarClassName}`}>
        <div className={`${config.avatar} rounded-full overflow-hidden bg-white shadow-sm border border-gray-200`}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(userName)} flex items-center justify-center`}>
              <span className="text-white font-bold">
                {userInitial}
              </span>
            </div>
          )}
        </div>
        
        {/* Online status indicator for larger sizes */}
        {(size === 'lg' || size === 'xl') && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
        )}
      </div>

      {/* User Info - aligned to top */}
      <div className={`min-w-0 flex-1 ${textAlignClasses} ${nameClassName}`}>
        <p className={`font-medium text-gray-900 ${config.text} ${clickable ? 'group-hover:text-blue-600' : ''} transition-colors truncate leading-tight`}>
          {userName}
        </p>
        
        {showPosition && user.position && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user.position}
          </p>
        )}
        
        {showEmail && user.email && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserAvatarName; 