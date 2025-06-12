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
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-pink-400 to-pink-600',
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
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(user.fullName)} flex items-center justify-center`}>
              <span className="text-white font-bold">
                {user.fullName.charAt(0).toUpperCase()}
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
          {user.fullName}
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