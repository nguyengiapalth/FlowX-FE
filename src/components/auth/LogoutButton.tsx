import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store.ts';
import {AlertTriangle} from "lucide-react";

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showConfirmation?: boolean;
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  showConfirmation = true,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    if (showConfirmation) {
      setShowModal(true);
    } else {
      performLogout();
    }
  };

  const performLogout = () => {
    logout();
    setShowModal(false);
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
      primary: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 border border-transparent',
      secondary: 'text-red-600 bg-red-50 hover:bg-red-100 focus:ring-red-500 border border-red-200 hover:border-red-300',
      icon: 'text-gray-600 hover:text-red-600 hover:bg-red-50 focus:ring-red-500 p-2 border border-gray-200 hover:border-red-200'
    };

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  const getIconSize = () => {
    return size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className={getButtonClasses()}
        title="Đăng xuất"
      >
        <LogoutButton className={`${getIconSize()} ${variant !== 'icon' ? 'mr-2' : ''}`}/>
        {variant !== 'icon' && (
          <span>Đăng xuất</span>
        )}
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full animate-slide-up">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi FlowX không?<br />
              <span className="text-sm text-gray-500">Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng.</span>
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Hủy
              </button>
              <button
                onClick={performLogout}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 