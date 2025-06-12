import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UserNameCardProps {
  user: {
    id: number;
    fullName: string;
    position?: string;
    email?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPosition?: boolean;
  showEmail?: boolean;
  showTime?: boolean;
  time?: string;
  clickable?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  variant?: 'default' | 'card' | 'minimal';
}

const textSizeConfig = {
  sm: {
    name: 'text-sm',
    detail: 'text-xs'
  },
  md: {
    name: 'text-base',
    detail: 'text-sm'
  },
  lg: {
    name: 'text-lg',
    detail: 'text-sm'
  },
  xl: {
    name: 'text-xl',
    detail: 'text-base'
  }
};

export const UserNameCard: React.FC<UserNameCardProps> = ({
  user,
  size = 'md',
  showPosition = false,
  showEmail = false,
  showTime = false,
  time,
  clickable = true,
  className = '',
  layout = 'vertical',
  variant = 'default'
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (clickable && user.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  const config = textSizeConfig[size];
  const isVertical = layout === 'vertical';
  
  // Different styling based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all';
      case 'minimal':
        return 'bg-transparent';
      default:
        return 'bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors';
    }
  };

  const baseClasses = isVertical 
    ? `flex flex-col items-center text-center space-y-1 ${className}`
    : `flex flex-col text-left space-y-1 ${className}`;

  const containerClasses = clickable 
    ? `${baseClasses} ${getVariantClasses()} cursor-pointer group`
    : `${baseClasses} ${getVariantClasses()}`;

  return (
    <div className={containerClasses} onClick={handleClick}>
      {/* User Name with Position inline */}
      <div className="flex items-center space-x-2 max-w-full">
        <h3 className={`font-semibold text-gray-900 ${config.name} ${clickable ? 'group-hover:text-blue-600' : ''} transition-colors truncate flex-shrink-0`}>
          {user.fullName}
        </h3>
        {showPosition && user.position && (
          <span className={`text-gray-600 ${config.detail} truncate flex-shrink font-medium`}>
            • {user.position}
          </span>
        )}
      </div>
      
      {/* Time - right under name */}
      {showTime && time && (
        <p className={`text-gray-500 ${config.detail} truncate max-w-full`}>
          {time}
        </p>
      )}
      
      {/* Email */}
      {showEmail && user.email && (
        <p className={`text-gray-500 ${config.detail} truncate max-w-full`}>
          {user.email}
        </p>
      )}
      
      {/* Additional info badges */}
      {variant === 'card' && (showPosition || showEmail) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {showPosition && user.position && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
              {user.position}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNameCard; 