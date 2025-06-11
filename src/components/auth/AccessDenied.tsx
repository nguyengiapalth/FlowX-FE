import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft} from "lucide-react";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  redirectPath?: string;
  redirectText?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Truy cập bị từ chối',
  message = 'Bạn không có quyền truy cập vào trang này.',
  redirectPath = '/',
  redirectText = 'Về trang chủ'
}) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <circle cx="12" cy="12" r="12" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        
        <Link
          to={redirectPath}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
            <ArrowLeft className="mr-2" />
          {redirectText}
        </Link>
      </div>
    </div>
  );
}; 