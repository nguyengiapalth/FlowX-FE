import { useMemo } from 'react';
import { useTaskStore } from '../stores/task-store';
import type { TaskResponse } from '../types/task';
import type { TaskStatus, PriorityLevel } from '../types/enums';

export interface TaskFilters {
  searchTerm?: string;
  status?: TaskStatus[];
  priority?: PriorityLevel[];
  assigneeId?: number;
  assignerId?: number;
  isOverdue?: boolean;
  dueDateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface TaskSortOptions {
  sortBy: 'title' | 'dueDate' | 'createdAt' | 'priority' | 'status' | 'assignee';
  sortOrder: 'asc' | 'desc';
}

export const useOptimizedTasks = (
  taskType: 'all' | 'assigned' | 'created' = 'all',
  filters?: TaskFilters, 
  sortOptions?: TaskSortOptions
) => {
  const { tasks, myAssignedTasks, myCreatedTasks, isLoading, error } = useTaskStore();

  // Select the appropriate task array based on type
  const baseTasks = useMemo(() => {
    switch (taskType) {
      case 'assigned':
        return myAssignedTasks;
      case 'created':
        return myCreatedTasks;
      default:
        return tasks;
    }
  }, [taskType, tasks, myAssignedTasks, myCreatedTasks]);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    if (!filters) return baseTasks;

    return baseTasks.filter(task => {
      // Search term filtering
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description?.toLowerCase().includes(searchLower);
        const matchesAssignee = task.assignee.fullName.toLowerCase().includes(searchLower);
        const matchesAssigner = task.assigner.fullName.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesDescription && !matchesAssignee && !matchesAssigner) {
          return false;
        }
      }

      // Status filtering
      if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
        return false;
      }

      // Priority filtering
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }

      // Assignee filtering
      if (filters.assigneeId && task.assignee.id !== filters.assigneeId) {
        return false;
      }

      // Assigner filtering
      if (filters.assignerId && task.assigner.id !== filters.assignerId) {
        return false;
      }

      // Overdue filtering
      if (filters.isOverdue !== undefined) {
        const isOverdue = task.dueDate && 
                         new Date(task.dueDate) < new Date() && 
                         task.status !== 'COMPLETED';
        if (filters.isOverdue !== isOverdue) {
          return false;
        }
      }

      // Due date range filtering
      if (filters.dueDateRange && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < filters.dueDateRange.startDate || dueDate > filters.dueDateRange.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [baseTasks, filters]);

  // Memoized sorted tasks
  const sortedTasks = useMemo(() => {
    if (!sortOptions) {
      // Default sorting: priority first, then due date
      return [...filteredTasks].sort((a, b) => {
        const priorityOrder: Record<string, number> = { 
          'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 
        };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'dueDate':
          if (a.dueDate && b.dueDate) {
            comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (a.dueDate) {
            comparison = -1;
          } else if (b.dueDate) {
            comparison = 1;
          }
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = { 
            'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 
          };
          comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
          break;
        case 'status':
          const statusOrder: Record<string, number> = {
            'TO_DO': 1, 'IN_PROGRESS': 2, 'COMPLETED': 3, 'CANCELLED': 4
          };
          comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          break;
        case 'assignee':
          comparison = a.assignee.fullName.localeCompare(b.assignee.fullName);
          break;
        default:
          return 0;
      }

      return sortOptions.sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredTasks, sortOptions]);

  // Memoized task statistics
  const taskStats = useMemo(() => {
    const stats = {
      total: baseTasks.length,
      toDo: baseTasks.filter(t => t.status === 'TO_DO').length,
      inProgress: baseTasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: baseTasks.filter(t => t.status === 'COMPLETED').length,
      cancelled: baseTasks.filter(t => t.status === 'CANCELLED').length,
      overdue: baseTasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== 'COMPLETED'
      ).length,
      highPriority: baseTasks.filter(t => t.priority === 'HIGH').length,
      withFiles: baseTasks.filter(t => t.hasFiles).length,
      dueSoon: baseTasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        const dueDate = new Date(t.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return dueDate <= threeDaysFromNow && dueDate >= new Date();
      }).length
    };

    return stats;
  }, [baseTasks]);

  // Memoized overdue tasks
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return baseTasks
      .filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'COMPLETED'
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [baseTasks]);

  // Memoized tasks due soon (next 7 days)
  const tasksDueSoon = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return baseTasks
      .filter(task => 
        task.dueDate && 
        task.status !== 'COMPLETED' &&
        new Date(task.dueDate) >= now &&
        new Date(task.dueDate) <= weekFromNow
      )
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [baseTasks]);

  // Memoized tasks by priority
  const tasksByPriority = useMemo(() => {
    const grouped = {
      CRITICAL: baseTasks.filter(t => t.priority === 'CRITICAL'),
      HIGH: baseTasks.filter(t => t.priority === 'HIGH'),
      MEDIUM: baseTasks.filter(t => t.priority === 'MEDIUM'),
      LOW: baseTasks.filter(t => t.priority === 'LOW')
    };

    return grouped;
  }, [baseTasks]);

  // Memoized completion percentage
  const completionStats = useMemo(() => {
    const total = baseTasks.length;
    if (total === 0) return { percentage: 0, completed: 0, total: 0 };

    const completed = baseTasks.filter(t => t.status === 'COMPLETED').length;
    const percentage = Math.round((completed / total) * 100);

    return { percentage, completed, total };
  }, [baseTasks]);

  return {
    // Data
    tasks: sortedTasks,
    allTasks: baseTasks,
    filteredTasks,
    overdueTasks,
    tasksDueSoon,
    tasksByPriority,
    
    // Statistics
    stats: taskStats,
    completionStats,
    
    // State
    isLoading,
    error,
    
    // Utilities
    hasFilters: !!filters,
    resultCount: sortedTasks.length,
    totalCount: baseTasks.length,
    taskType
  };
}; 