import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UserAvatarProps {
  user: {
    id: number;
    fullName: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  clickable?: boolean;
  className?: string;
  showOnlineStatus?: boolean;
}

const sizeConfig = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20'
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

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  clickable = true,
  className = '',
  showOnlineStatus = false
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable && user.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const avatarSizeClass = sizeConfig[size];
  const containerClasses = clickable 
    ? `relative flex-shrink-0 cursor-pointer group transition-transform hover:scale-105 ${className}`
    : `relative flex-shrink-0 ${className}`;

  return (
    <div className={containerClasses} onClick={handleClick}>
      <div className={`${avatarSizeClass} rounded-full overflow-hidden bg-white shadow-sm border border-gray-200 ${clickable ? 'group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2' : ''} transition-all`}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(user.fullName)} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

export default UserAvatar; 