import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useTaskStore } from '../stores/task-store';
import { useAutoRefresh } from './useAutoRefresh';
import type { TaskStatus } from '../types/enums';

interface TaskAutoRefreshOptions {
  enabled?: boolean;
  interval?: number;
  refreshType?: 'all' | 'assigned' | 'created' | 'project' | 'department' | 'status';
  projectId?: number;
  departmentId?: number;
  status?: TaskStatus;
}

export const useTaskAutoRefresh = ({
  enabled = true,
  interval = 3600000, // 60 phút
  refreshType = 'all',
  projectId,
  departmentId,
  status
}: TaskAutoRefreshOptions = {}) => {
  const {
    fetchAllTasks,
    fetchMyAssignedTasks,
    fetchMyCreatedTasks,
    fetchTasksByProject,
    fetchTasksByDepartment,
    fetchTasksByStatus,
    tasks,
    myAssignedTasks,
    myCreatedTasks,
    isLoading,
    error
  } = useTaskStore();

  // Sử dụng ref để tránh re-create callback
  const refreshTypeRef = useRef(refreshType);
  const projectIdRef = useRef(projectId);
  const departmentIdRef = useRef(departmentId);
  const statusRef = useRef(status);

  // Cập nhật refs khi props thay đổi
  useEffect(() => {
    refreshTypeRef.current = refreshType;
    projectIdRef.current = projectId;
    departmentIdRef.current = departmentId;
    statusRef.current = status;
  }, [refreshType, projectId, departmentId, status]);

  // Tạo callback refresh stable
  const onRefresh = useCallback(async () => {
    try {
      switch (refreshTypeRef.current) {
        case 'all':
          await fetchAllTasks();
          break;
        case 'assigned':
          await fetchMyAssignedTasks();
          break;
        case 'created':
          await fetchMyCreatedTasks();
          break;
        case 'project':
          if (projectIdRef.current !== undefined) {
            await fetchTasksByProject(projectIdRef.current);
          }
          break;
        case 'department':
          if (departmentIdRef.current !== undefined) {
            await fetchTasksByDepartment(departmentIdRef.current);
          }
          break;
        case 'status':
          if (statusRef.current) {
            await fetchTasksByStatus(statusRef.current);
          }
          break;
        default:
          await fetchAllTasks();
      }
    } catch (error) {
      console.error('Task refresh error:', error);
      throw error;
    }
  }, [
    fetchAllTasks,
    fetchMyAssignedTasks,
    fetchMyCreatedTasks,
    fetchTasksByProject,
    fetchTasksByDepartment,
    fetchTasksByStatus
  ]);

  const autoRefresh = useAutoRefresh({
    enabled,
    interval,
    onRefresh,
    onError: (error) => {
      console.error('Auto refresh task error:', error);
    }
  });

  // Lấy tasks phù hợp với refreshType - memoize để tránh re-render
  const currentTasks = useMemo(() => {
    switch (refreshType) {
      case 'assigned':
        return myAssignedTasks;
      case 'created':
        return myCreatedTasks;
      default:
        return tasks;
    }
  }, [refreshType, tasks, myAssignedTasks, myCreatedTasks]);

  return {
    ...autoRefresh,
    tasks: currentTasks,
    allTasks: tasks,
    myAssignedTasks,
    myCreatedTasks,
    isLoading,
    error,
    // Thêm các method tiện ích
    refreshNow: autoRefresh.refresh,
    toggleAutoRefresh: autoRefresh.toggle,
    isAutoRefreshActive: autoRefresh.isActive
  };
}; 