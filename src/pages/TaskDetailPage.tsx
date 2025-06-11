import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/task-store';
import { useAuthStore } from '../stores/auth-store';
import TaskDetail from '../components/tasks/TaskDetail';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { currentTask, isLoading, error, fetchTaskById } = useTaskStore();
  const { currentUser } = useAuthStore();

  useEffect(() => {
    if (taskId) {
      fetchTaskById(parseInt(taskId));
    }
  }, [taskId, fetchTaskById]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải thông tin task...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTask) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy task</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error || 'Task này có thể đã bị xóa hoặc bạn không có quyền truy cập.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/tasks')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Quay lại danh sách task
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Quay lại danh sách task
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Chi tiết Task</h1>
      </div>

      {/* Task Detail Component */}
      <TaskDetail task={currentTask} />
    </div>
  );
};

export default TaskDetailPage; 