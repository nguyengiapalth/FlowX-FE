import React, { useState } from 'react';
import { 
  RefreshCcw, 
  Play, 
  Pause, 
  Settings, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AutoRefreshControlProps {
  isRefreshing: boolean;
  isActive: boolean;
  lastRefreshTime: Date | null;
  onToggle: () => void;
  onRefreshNow: () => void;
  onIntervalChange?: (interval: number) => void;
  currentInterval?: number;
  className?: string;
  compact?: boolean;
}

export const AutoRefreshControl: React.FC<AutoRefreshControlProps> = ({
  isRefreshing,
  isActive,
  lastRefreshTime,
  onToggle,
  onRefreshNow,
  onIntervalChange,
  currentInterval = 30000,
  className = '',
  compact = false
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return 'Chưa refresh';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    return date.toLocaleTimeString('vi-VN');
  };

  const getIntervalOptions = () => [
    { value: 15000, label: '15 giây' },
    { value: 30000, label: '30 giây' },
    { value: 60000, label: '1 phút' },
    { value: 120000, label: '2 phút' },
    { value: 300000, label: '5 phút' },
    { value: 600000, label: '10 phút' },
    { value: 1800000, label: '30 phút' },
    { value: 3600000, label: '60 phút' }
  ];

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className={`p-2 rounded-full transition-all duration-200 ${
            isRefreshing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          title="Refresh ngay"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        
        <button
          onClick={onToggle}
          className={`p-2 rounded-full transition-all duration-200 ${
            isActive
              ? 'bg-green-50 text-green-600 hover:bg-green-100'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          title={isActive ? 'Tắt auto refresh' : 'Bật auto refresh'}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {isActive && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              {currentInterval >= 60000 
                ? `${Math.floor(currentInterval / 60000)}p`
                : `${Math.floor(currentInterval / 1000)}s`
              }
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            isActive ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isActive ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-gray-600" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Auto Refresh
            </h3>
            <p className="text-xs text-gray-500">
              {isActive ? 'Đang hoạt động' : 'Đã tắt'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Cài đặt"
        >
          <Settings className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-3">
        <button
          onClick={onRefreshNow}
          disabled={isRefreshing}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            isRefreshing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Đang refresh...' : 'Refresh ngay'}</span>
        </button>

        <button
          onClick={onToggle}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Tắt</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Bật</span>
            </>
          )}
        </button>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Lần cuối: {formatLastRefresh(lastRefreshTime)}</span>
        </div>
        {isActive && (
          <div className="mt-1">
            Tự động refresh mỗi {
              currentInterval >= 60000 
                ? `${Math.floor(currentInterval / 60000)} phút`
                : `${Math.floor(currentInterval / 1000)} giây`
            }
          </div>
        )}
      </div>

      {showSettings && onIntervalChange && (
        <div className="mt-3 pt-3 border-t">
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Khoảng thời gian refresh
            </label>
            <select
              value={currentInterval}
              onChange={(e) => onIntervalChange(Number(e.target.value))}
              className="block w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
            >
              {getIntervalOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}; 