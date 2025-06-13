import React from 'react';
import { useLocalStorageStats } from '../hooks/useLocalStorageStats';
import { logLocalStorageUsage, exportLocalStorageData } from '../utils/localStorage.utils';

interface LocalStorageTrackerProps {
  className?: string;
}

export const LocalStorageTracker: React.FC<LocalStorageTrackerProps> = ({ 
  className = '' 
}) => {
  const { 
    stats, 
    isLoading, 
    isNearLimit, 
    refreshStats, 
    clearAllData 
  } = useLocalStorageStats({
    autoRefresh: true,
    refreshInterval: 10000, // 10 seconds
    warningThreshold: 75,
    onWarning: (stats) => {
      console.warn('⚠️ localStorage gần đầy!', stats);
    }
  });

  const handleLogToConsole = () => {
    logLocalStorageUsage();
  };

  const handleExportData = () => {
    const data = exportLocalStorageData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="animate-pulse">Đang tải thông tin localStorage...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`p-4 bg-red-100 rounded-lg ${className}`}>
        <div className="text-red-600">Không thể tải thông tin localStorage</div>
      </div>
    );
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📊 localStorage Tracker
        </h3>
        {isNearLimit && (
          <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            ⚠️ Gần đầy
          </div>
        )}
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Tổng dung lượng</div>
          <div className="text-2xl font-bold text-blue-800">
            {stats.totalSizeMB.toFixed(2)} MB
          </div>
          <div className="text-sm text-blue-600">
            ({stats.totalSizeKB} KB)
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 font-medium">Số items</div>
          <div className="text-2xl font-bold text-purple-800">
            {stats.totalItems}
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-600 font-medium">Tỷ lệ sử dụng</div>
          <div className="text-2xl font-bold text-orange-800">
            {stats.usagePercentage}%
          </div>
        </div>
      </div>

      {/* Usage Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Dung lượng đã sử dụng</span>
          <span>{stats.usagePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-300 ${getUsageColor(stats.usagePercentage)}`}
            style={{ width: `${Math.min(stats.usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Top Items */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          🔍 Top items lớn nhất:
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {stats.itemDetails.slice(0, 5).map((item, index) => (
            <div 
              key={item.key} 
              className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">
                  {index + 1}. {item.key}
                </div>
                <div className="text-gray-500 text-xs truncate">
                  {item.value}
                </div>
              </div>
              <div className="ml-2 text-gray-600 font-medium">
                {item.sizeKB} KB
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={refreshStats}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
        >
          🔄 Refresh
        </button>
        
        <button
          onClick={handleLogToConsole}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
        >
          📝 Log to Console
        </button>
        
        <button
          onClick={handleExportData}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
        >
          💾 Export Data
        </button>
        
        <button
          onClick={clearAllData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        💡 Tip: Mở Console để xem logs chi tiết hoặc thử thêm/xóa localStorage items
      </div>
    </div>
  );
}; 