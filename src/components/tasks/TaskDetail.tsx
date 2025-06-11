import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../stores/task-store.ts';
import { useProfileStore } from '../../stores/profile-store.ts';
import taskService from '../../services/task.service.ts';
import TaskFileUpload from './TaskFileUpload.tsx';
import type { TaskResponse, TaskUpdateRequest } from '../../types/task.ts';
import type { TaskStatus, PriorityLevel } from '../../types/enums/enums.ts';

interface TaskDetailProps {
  taskId: number;
  onClose?: () => void;
  onUpdate?: (task: TaskResponse) => void;
  onDelete?: (taskId: number) => void;
  className?: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({
  taskId,
  onClose,
  onUpdate,
  onDelete,
  className = ''
}) => {
  const { currentTask, fetchTaskById, updateTask, deleteTask, updateTaskStatus, isLoading } = useTaskStore();
  const { user } = useProfileStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TaskUpdateRequest>({});

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
    }
  }, [taskId, fetchTaskById]);

  useEffect(() => {
    if (currentTask) {
      setEditForm({
        title: currentTask.title,
        description: currentTask.description,
        dueDate: currentTask.dueDate?.split('T')[0],
        startDate: currentTask.startDate?.split('T')[0],
        progress: currentTask.progress,
        priority: currentTask.priority,
        status: currentTask.status
      });
    }
  }, [currentTask]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy task</h3>
          <p className="text-gray-500">Task không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

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

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: PriorityLevel) => {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      default: return 'Chưa xác định';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Chưa xác định';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const isOverdue = currentTask.dueDate && new Date(currentTask.dueDate) < new Date() && currentTask.status !== 'COMPLETED';
  const canModify = user?.id === currentTask.assigner?.id || user?.id === currentTask.assignee?.id;

  const handleStatusUpdate = async (newStatus: TaskStatus) => {
    try {
      const updatedTask = await updateTaskStatus(currentTask.id, newStatus);
      onUpdate?.(updatedTask);
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;
    
    try {
      await deleteTask(currentTask.id);
      onDelete?.(currentTask.id);
      onClose?.();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updatedTask = await updateTask(currentTask.id, editForm);
      onUpdate?.(updatedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getTargetTypeText = (targetType: string) => {
    switch (targetType) {
      case 'PROJECT': return 'Dự án';
      case 'DEPARTMENT': return 'Phòng ban';
      default: return targetType;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="text-2xl font-bold text-gray-900 w-full border-none outline-none bg-transparent"
                placeholder="Tiêu đề task"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{currentTask.title}</h1>
            )}
            
            <div className="flex items-center space-x-3 mt-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(currentTask.status)}`}>
                {getStatusText(currentTask.status)}
              </span>
              
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(currentTask.priority)}`}>
                {getPriorityText(currentTask.priority)}
              </span>
              
              {isOverdue && (
                <span className="bg-red-100 text-red-800 px-3 py-1 text-sm font-medium rounded-full">
                  Quá hạn
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canModify && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300"
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                      {currentTask.status !== 'COMPLETED' && (
                          <button
                              onClick={() => handleStatusUpdate('COMPLETED')}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            ✓ Hoàn thành
                          </button>
                      )}
                      {currentTask.status === 'TO_DO' && (
                          <button
                              onClick={() => handleStatusUpdate('IN_PROGRESS')}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            ▶ Bắt đầu
                          </button>
                      )}
                      {currentTask.status === 'COMPLETED' && (
                          <button
                              onClick={() => handleStatusUpdate('IN_PROGRESS')}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          >
                            ↻ Mở lại
                          </button>
                      )}
                      <button
                          onClick={handleDelete}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        🗑 Xóa
                      </button>
                  </>
                )}
              </>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Đóng"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả</h3>
              {isEditing ? (
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả chi tiết về task..."
                />
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  {currentTask.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{currentTask.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">Chưa có mô tả</p>
                  )}
                </div>
              )}
            </div>

            {/* Progress */}
            {(currentTask.progress !== undefined && currentTask.progress !== null) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tiến độ</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Hoàn thành</span>
                    <span className="text-sm font-semibold text-gray-900">{currentTask.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentTask.progress}%` }}
                    ></div>
                  </div>
                  {isEditing && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={editForm.progress || 0}
                      onChange={(e) => setEditForm({ ...editForm, progress: parseInt(e.target.value) })}
                      className="w-full mt-3"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Files */}
            <div>
              <TaskFileUpload
                taskId={currentTask.id}
                canUpload={canModify}
                files={currentTask.files || []}
                onFilesUpdated={() => {
                  // Refresh task data when files are updated
                  fetchTaskById(currentTask.id);
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* People */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Người liên quan</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Người giao việc</div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                      {currentTask.assigner.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{currentTask.assigner.fullName}</div>
                      <div className="text-sm text-gray-500">{currentTask.assigner.email}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Người thực hiện</div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-2">
                      {currentTask.assignee.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{currentTask.assignee.fullName}</div>
                      <div className="text-sm text-gray-500">{currentTask.assignee.email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thời gian</h3>
              <div className="space-y-3">
                {isEditing ? (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm text-gray-500 block mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={editForm.startDate || ''}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-sm text-gray-500 block mb-1">Ngày hết hạn</label>
                      <input
                        type="date"
                        value={editForm.dueDate || ''}
                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500 mb-1">Ngày bắt đầu</div>
                      <div className="font-medium text-gray-900">{formatDate(currentTask.startDate)}</div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm text-gray-500 mb-1">Ngày hết hạn</div>
                      <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(currentTask.dueDate)}
                      </div>
                    </div>

                    {currentTask.completedDate && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500 mb-1">Ngày hoàn thành</div>
                        <div className="font-medium text-green-600">{formatDate(currentTask.completedDate)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Target Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Phạm vi</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Loại</div>
                <div className="font-medium text-gray-900">{getTargetTypeText(currentTask.targetType)}</div>
                <div className="text-sm text-gray-500 mt-2">ID: {currentTask.targetId}</div>
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Thông tin hệ thống</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Ngày tạo</div>
                  <div className="font-medium text-gray-900 text-sm">{formatDateTime(currentTask.createdAt)}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">Cập nhật lần cuối</div>
                  <div className="font-medium text-gray-900 text-sm">{formatDateTime(currentTask.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;