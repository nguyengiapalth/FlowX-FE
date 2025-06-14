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

  // Sử dụng refs để tránh dependency changes gây ra re-create callback
  const fetchAllTasksRef = useRef(fetchAllTasks);
  const fetchMyAssignedTasksRef = useRef(fetchMyAssignedTasks);
  const fetchMyCreatedTasksRef = useRef(fetchMyCreatedTasks);
  const fetchTasksByProjectRef = useRef(fetchTasksByProject);
  const fetchTasksByDepartmentRef = useRef(fetchTasksByDepartment);
  const fetchTasksByStatusRef = useRef(fetchTasksByStatus);

  // Cập nhật refs khi store functions thay đổi
  useEffect(() => {
    fetchAllTasksRef.current = fetchAllTasks;
    fetchMyAssignedTasksRef.current = fetchMyAssignedTasks;
    fetchMyCreatedTasksRef.current = fetchMyCreatedTasks;
    fetchTasksByProjectRef.current = fetchTasksByProject;
    fetchTasksByDepartmentRef.current = fetchTasksByDepartment;
    fetchTasksByStatusRef.current = fetchTasksByStatus;
  }, [fetchAllTasks, fetchMyAssignedTasks, fetchMyCreatedTasks, fetchTasksByProject, fetchTasksByDepartment, fetchTasksByStatus]);

  // Tạo callback refresh stable - không có dependencies
  const onRefresh = useCallback(async () => {
    try {
      console.log(`[TaskAutoRefresh] Refreshing tasks - type: ${refreshTypeRef.current}, time: ${new Date().toLocaleTimeString()}`);
      switch (refreshTypeRef.current) {
        case 'all':
          await fetchAllTasksRef.current();
          break;
        case 'assigned':
          await fetchMyAssignedTasksRef.current();
          break;
        case 'created':
          await fetchMyCreatedTasksRef.current();
          break;
        case 'project':
          if (projectIdRef.current !== undefined) {
            await fetchTasksByProjectRef.current(projectIdRef.current);
          }
          break;
        case 'department':
          if (departmentIdRef.current !== undefined) {
            await fetchTasksByDepartmentRef.current(departmentIdRef.current);
          }
          break;
        case 'status':
          if (statusRef.current) {
            await fetchTasksByStatusRef.current(statusRef.current);
          }
          break;
        default:
          await fetchAllTasksRef.current();
      }
      console.log(`[TaskAutoRefresh] Refresh completed - type: ${refreshTypeRef.current}`);
    } catch (error) {
      console.error('Task refresh error:', error);
      throw error;
    }
  }, []); // Empty dependency array - stable callback

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