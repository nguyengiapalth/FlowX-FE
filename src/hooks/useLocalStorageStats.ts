import { useState, useEffect, useCallback } from 'react';
import { 
  getLocalStorageStats, 
  isLocalStorageNearLimit,
  setupLocalStorageMonitoring
} from '../utils/localStorage.utils';
import type { StorageStats, StorageConfig } from '../utils/localStorage.utils';

export interface UseLocalStorageStatsOptions {
  config?: Partial<StorageConfig>;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  warningThreshold?: number;
  onWarning?: (stats: StorageStats) => void;
}

export interface UseLocalStorageStatsReturn {
  stats: StorageStats | null;
  isLoading: boolean;
  isNearLimit: boolean;
  refreshStats: () => void;
  clearAllData: () => void;
}

/**
 * React hook for tracking localStorage usage
 */
export function useLocalStorageStats(
  options: UseLocalStorageStatsOptions = {}
): UseLocalStorageStatsReturn {
  const {
    config = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    warningThreshold = 80,
    onWarning,
  } = options;

  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = useCallback(() => {
    try {
      const newStats = getLocalStorageStats(config);
      setStats(newStats);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to get localStorage stats:', error);
      setIsLoading(false);
    }
  }, [config]);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    refreshStats();
  }, [refreshStats]);

  const isNearLimit = stats ? isLocalStorageNearLimit(config, warningThreshold) : false;

  // Initial load
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(refreshStats, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, refreshStats]);

  // Warning monitoring
  useEffect(() => {
    if (!onWarning) return;

    const cleanup = setupLocalStorageMonitoring(config, {
      warningThreshold,
      checkInterval: refreshInterval,
      onWarning,
    });

    return cleanup;
  }, [config, warningThreshold, refreshInterval, onWarning]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      refreshStats();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for manual localStorage modifications in the same tab
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    localStorage.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);
      setTimeout(refreshStats, 0); // Async to avoid blocking
    };

    localStorage.removeItem = function(key: string) {
      originalRemoveItem.call(this, key);
      setTimeout(refreshStats, 0);
    };

    localStorage.clear = function() {
      originalClear.call(this);
      setTimeout(refreshStats, 0);
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    isNearLimit,
    refreshStats,
    clearAllData,
  };
} 