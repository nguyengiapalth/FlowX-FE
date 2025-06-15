import React, { useState, useEffect } from 'react';
import type { TaskCreateRequest, TaskResponse } from '../../types/task.ts';
import type { PriorityLevel, ContentTargetType } from '../../types/enums.ts';
import type { UserResponse } from '../../types/user.ts';
import { useTaskStore } from '../../stores/task-store';
import userService from '../../services/user.service.ts';
import SimpleToast from '../utils/SimpleToast.tsx';
import { 
  X 
} from 'lucide-react';

interface TaskCreateFormProps {
  onClose: () => void;
  onTaskCreated?: (task: TaskResponse) => void;
  targetType?: ContentTargetType;
  targetId?: number;
  availableUsers?: UserResponse[]; // Pass filtered users from parent
}

const TaskCreateForm: React.FC<TaskCreateFormProps> = ({
  onClose,
  onTaskCreated,
  targetType = 'GLOBAL',
  targetId = 0,
  availableUsers
}) => {
  const { createTask } = useTaskStore();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [formData, setFormData] = useState<TaskCreateRequest>({
    title: '',
    description: '',
    targetType,
    targetId,
    assignerId: 0, // Will be set from current user
    assigneeId: 0,
    dueDate: '',
    priority: 'MEDIUM',
    status: 'TO_DO'
  });

  useEffect(() => {
    if (availableUsers) {
      // Use filtered users passed from parent
      setUsers(availableUsers);
    } else {
      // Fallback to all users if no filtered users provided
      fetchUsers();
    }
  }, [availableUsers]);

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.code === 200 && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setToast({ message: 'Vui lòng nhập tiêu đề task', type: 'error' });
      return;
    }
    
    if (!formData.assigneeId) {
      setToast({ message: 'Vui lòng chọn người được giao', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const createdTask = await createTask(formData);
      
      if (createdTask) {        
        setToast({ message: 'Tạo task thành công!', type: 'success' });
        onTaskCreated?.(createdTask);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setToast({ message: 'Có lỗi xảy ra khi tạo task', type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      setToast({ message: 'Có lỗi xảy ra khi tạo task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof TaskCreateRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo task mới</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề task..."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mô tả chi tiết task..."
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người được giao *
            </label>
            <select
              value={formData.assigneeId}
              onChange={(e) => handleInputChange('assigneeId', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value={0}>Chọn người được giao</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Độ ưu tiên
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as PriorityLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
              <option value="CRITICAL">Quan trọng</option>
              <option value="URGENT">Khẩn cấp</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hạn hoàn thành
            </label>
            <input
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Target Type & ID (for debugging or manual input) */}
          {targetType === 'GLOBAL' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phạm vi
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) => handleInputChange('targetType', e.target.value as ContentTargetType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GLOBAL">Toàn công ty</option>
                  <option value="DEPARTMENT">Department</option>
                  <option value="PROJECT">Project</option>
                </select>
              </div>
              
              {formData.targetType !== 'GLOBAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID {formData.targetType === 'DEPARTMENT' ? 'Department' : 'Project'}
                  </label>
                  <input
                    type="number"
                    value={formData.targetId}
                    onChange={(e) => handleInputChange('targetId', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập ID..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang tạo...
                </>
              ) : (
                'Tạo task'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TaskCreateForm; 