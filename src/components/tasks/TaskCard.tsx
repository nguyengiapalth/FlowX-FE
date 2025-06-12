import React, { useState } from 'react';
import { useProfileStore } from '../../stores/profile-store.ts';
import { useNavigationActions } from '../../utils/navigation.utils';
import taskService from '../../services/task.service.ts';
import type { TaskResponse } from '../../types/task.ts';
import type { TaskStatus } from '../../types/enums.ts';
import {
  Calendar, 
  User, 
} from 'lucide-react';

interface TaskCardProps {
  task: TaskResponse;
  onUpdate?: (task: TaskResponse) => void;
  onDelete?: (taskId: number) => void;
  showProject?: boolean;
  showDepartment?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  showProject = true,
  showDepartment = false
}) => {
  const { handleTaskClick } = useNavigationActions();
  const { user } = useProfileStore();
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TO_DO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'TO_DO': return 'Chưa bắt đầu';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      default: return priority || 'Chưa xác định';
    }
  };

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    try {
      setLoading(true);
      const response = await taskService.updateTaskStatus(task.id, newStatus);
      
      if (response.code === 200 && response.data) {
        onUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    
    try {
      setLoading(true);
      const response = await taskService.deleteTask(task.id);
      
      if (response.code === 200) {
        onDelete?.(task.id);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handleClickDetail = () => {
    handleTaskClick(task.id);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
  const canModify = user?.id === task.assigner?.id || user?.id === task.assignee?.id;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer relative" onClick={handleClickDetail}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-1 hover:text-blue-600 transition-colors">{task.title}</h3>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
              {getStatusText(task.status)}
            </span>
            {task.priority && (
              <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                ● {getPriorityText(task.priority)}
              </span>
            )}
            {isOverdue && (
              <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-medium rounded-full">
                Quá hạn
              </span>
            )}
          </div>
        </div>
        
        {canModify && (
          <div className="flex items-center space-x-1">
            {task.status !== 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate('COMPLETED');
                }}
                disabled={loading}
                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                title="Hoàn thành"
              >
                ✓
              </button>
            )}
            {task.status === 'TO_DO' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate('IN_PROGRESS');
                }}
                disabled={loading}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Bắt đầu"
              >
                ▶
              </button>
            )}
            {task.status === 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate('IN_PROGRESS');
                }}
                disabled={loading}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Mở lại"
              >
                ↻
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={loading}
              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
              title="Xóa"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Project/Department info */}
      <div className="space-y-2 mb-3">
        {showProject && task.targetType === 'PROJECT' && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Project ID: {task.targetId}</span>
          </div>
        )}
        
        {showDepartment && task.targetType === 'DEPARTMENT' && (
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Department ID: {task.targetId}</span>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4" />
              <span>{task.assignee.fullName}</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600' : ''}`}>
              <Calendar className="w-4 h-4" />
              <span>Hạn: {formatDate(task.dueDate)}</span>
            </div>
          )}
        </div>
        
        <span>Tạo: {formatDate(task.createdAt)}</span>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default TaskCard; 