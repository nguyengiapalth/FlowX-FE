import { useCallback } from 'react';
import { useContentStore } from '../stores/content-store';
import { useAutoRefresh } from './useAutoRefresh';
import type { ContentTargetType } from '../types/enums';

interface ContentAutoRefreshOptions {
  enabled?: boolean;
  interval?: number;
  refreshType?: 'global' | 'all' | 'target' | 'user';
  targetType?: ContentTargetType;
  targetId?: number;
  userId?: number;
}

export const useContentAutoRefresh = ({
  enabled = true,
  interval = 600000, // 10 phút
  refreshType = 'global',
  targetType,
  targetId,
  userId
}: ContentAutoRefreshOptions = {}) => {
  const {
    fetchAllContents,
    fetchAllContentsFromAllSources,
    fetchContentsByTarget,
    fetchContentsByUser,
    isLoading,
    error,
    contents
  } = useContentStore();

  // Tạo callback refresh phù hợp với loại refresh
  const onRefresh = useCallback(async () => {
    try {
      switch (refreshType) {
        case 'global':
          await fetchAllContents();
          break;
        case 'all':
          await fetchAllContentsFromAllSources();
          break;
        case 'target':
          if (targetType && targetId !== undefined) {
            await fetchContentsByTarget(targetType, targetId);
          }
          break;
        case 'user':
          if (userId) {
            await fetchContentsByUser(userId);
          }
          break;
        default:
          await fetchAllContents();
      }
    } catch (error) {
      console.error('Content refresh error:', error);
      throw error;
    }
  }, [
    refreshType,
    targetType,
    targetId,
    userId,
    fetchAllContents,
    fetchAllContentsFromAllSources,
    fetchContentsByTarget,
    fetchContentsByUser
  ]);

  const autoRefresh = useAutoRefresh({
    enabled,
    interval,
    onRefresh,
    onError: (error) => {
      console.error('Auto refresh content error:', error);
    }
  });

  return {
    ...autoRefresh,
    contents,
    isLoading,
    error,
    // Thêm các method tiện ích
    refreshNow: autoRefresh.refresh,
    toggleAutoRefresh: autoRefresh.toggle,
    isAutoRefreshActive: autoRefresh.isActive
  };
}; 