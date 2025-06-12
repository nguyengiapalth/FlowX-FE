import React, { useState, useEffect } from 'react';
import type { TaskResponse } from '../../types/task.ts';
import type { UserResponse } from '../../types/user.ts';
import type { ContentTargetType } from '../../types/enums.ts';
import taskService from '../../services/task.service.ts';
import userService from '../../services/user.service.ts';
import departmentService from '../../services/department.service.ts';
import projectMemberService from '../../services/project-member.service.ts';
import TaskCard from './TaskCard';
import TaskCreateForm from './TaskCreateForm.tsx';
import SimpleToast from '../utils/SimpleToast.tsx';
import { 
  Plus, 
  ClipboardList 
} from 'lucide-react';

interface TaskSectionProps {
  targetType: ContentTargetType;
  targetId: number;
  title?: string;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  targetType,
  targetId,
  title = 'Quản lý Task'
}) => {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchAvailableUsers();
  }, [targetType, targetId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let response;
      
      if (targetType === 'DEPARTMENT') {
        response = await taskService.getTasksByDepartmentId(targetId);
      } else if (targetType === 'PROJECT') {
        response = await taskService.getTasksByProjectId(targetId);
      } else {
        response = await taskService.getAllTasks();
      }
      
      if (response.code === 200 && response.data) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setToast({ message: 'Có lỗi xảy ra khi tải danh sách task', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask: TaskResponse) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setToast({ message: 'Cập nhật task thành công!', type: 'success' });
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    setToast({ message: 'Xóa task thành công!', type: 'success' });
  };

  const fetchAvailableUsers = async () => {
    try {
      let users: UserResponse[] = [];
      
      if (targetType === 'DEPARTMENT') {
        // Get users in the specific department
        const response = await userService.getUsersByDepartment(targetId);
        if (response.code === 200 && response.data) {
          users = response.data;
        }
      } else if (targetType === 'PROJECT') {
        // Get project members
        const response = await projectMemberService.getMembersByProjectId(targetId);
        if (response.code === 200 && response.data) {
          // Extract user information from project member responses
          users = response.data.map(member => member.user).filter(Boolean);
        }
      } else {
        // For global tasks, get all users
        const response = await userService.getAllUsers();
        if (response.code === 200 && response.data) {
          users = response.data;
        }
      }
      
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to fetch available users:', error);
      // Fallback to all users if filtering fails
      try {
        const response = await userService.getAllUsers();
        if (response.code === 200 && response.data) {
          setAvailableUsers(response.data);
        }
      } catch (fallbackError) {
        console.error('Failed to fetch fallback users:', fallbackError);
        setAvailableUsers([]);
      }
    }
  };

  const handleTaskCreated = (newTask: TaskResponse) => {
    setTasks(prev => [newTask, ...prev]);
    setToast({ message: 'Tạo task thành công!', type: 'success' });
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      toDo: tasks.filter(t => t.status === 'TO_DO').length
    };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý và theo dõi các task của {targetType.toLowerCase()}
          </p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng số</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="text-blue-600 text-xl">📋</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chưa làm</p>
              <p className="text-xl font-bold text-gray-600">{stats.toDo}</p>
            </div>
            <div className="text-gray-600 text-xl">📝</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đang làm</p>
              <p className="text-xl font-bold text-primary-600">{stats.inProgress}</p>
            </div>
            <div className="text-primary-600 text-xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
              <p className="text-xl font-bold text-secondary-600">{stats.completed}</p>
            </div>
            <div className="text-secondary-600 text-xl">✅</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Danh sách Task
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({tasks.length} task)
            </span>
          </h3>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Đang tải danh sách task...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có task nào</h3>
            <p className="text-gray-500">Chưa có task nào được tạo cho {targetType.toLowerCase()} này.</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-blue-600 hover:text-blue-500 font-medium"
            >
              Tạo task đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                showProject={targetType !== 'PROJECT'}
                showDepartment={targetType !== 'DEPARTMENT'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <TaskCreateForm
          onClose={() => setShowCreateForm(false)}
          onTaskCreated={handleTaskCreated}
          targetType={targetType}
          targetId={targetId}
          availableUsers={availableUsers}
        />
      )}

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

export default TaskSection; 