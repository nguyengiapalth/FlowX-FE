import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { useProfileStore } from '../stores/profile-store';
import { useTaskStore } from '../stores/task-store';
import taskService from '../services/task.service';
import type { TaskResponse } from '../types/task';
import { Plus, FileText } from 'lucide-react';
import TaskCreateForm from '../components/tasks/TaskCreateForm.tsx';
import SimpleToast from '../components/utils/SimpleToast.tsx';

const TaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useProfileStore();
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks' | 'assigned'>('all');
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (activeTab) {
        case 'my-tasks':
          response = await taskService.getMyAssignedTasks();
          break;
        case 'assigned':
          response = await taskService.getMyCreatedTasks();
          break;
        default:
          response = await taskService.getAllTasks();
          break;
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
    <>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý công việc</h1>
          <p className="text-gray-600">Theo dõi và quản lý các task của dự án</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số task</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-blue-600 text-2xl">📋</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chưa bắt đầu</p>
                <p className="text-2xl font-bold text-gray-600">{stats.toDo}</p>
              </div>
              <div className="text-gray-600 text-2xl">📝</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang thực hiện</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="text-blue-600 text-2xl">⏳</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="text-green-600 text-2xl">✅</div>
            </div>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-tasks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Task của tôi
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'assigned'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Task tôi giao
            </button>
          </div>
          
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo task mới</span>
          </button>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'all' && 'Tất cả task'}
              {activeTab === 'my-tasks' && 'Task của tôi'}
              {activeTab === 'assigned' && 'Task tôi giao'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({tasks.length} task)
              </span>
            </h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải danh sách task...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Không có task nào</h3>
              <p className="text-gray-500">Chưa có task nào thuộc danh mục này.</p>
            </div>
          ) : (
            /* Tasks List */
            <div className="divide-y divide-gray-200">
              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Task</div>
                  <div className="col-span-2">Người được giao</div>
                  <div className="col-span-2">Hạn hoàn thành</div>
                  <div className="col-span-1">Độ ưu tiên</div>
                  <div className="col-span-1">Trạng thái</div>
                  <div className="col-span-2 text-center">Thao tác</div>
                </div>
              </div>

              {/* Table Body */}
              {tasks.map((task) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'TO_DO': return 'bg-gray-100 text-gray-800';
                    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
                    case 'COMPLETED': return 'bg-green-100 text-green-800';
                    case 'CANCELLED': return 'bg-red-100 text-red-800';
                    default: return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusText = (status: string) => {
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

                const formatDate = (dateString?: string) => {
                  if (!dateString) return 'Chưa xác định';
                  return new Date(dateString).toLocaleDateString('vi-VN');
                };

                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                const canModify = user?.id === task.assigner?.id || user?.id === task.assignee?.id;

                return (
                  <div
                      key={task.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                    <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                      {/* Task Info */}
                      <div className="col-span-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate" title={task.title}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs text-gray-500 truncate" title={task.description}>
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2">
                            {task.targetType === 'PROJECT' && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Project #{task.targetId}
                              </span>
                            )}
                            {task.targetType === 'DEPARTMENT' && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                                Dept #{task.targetId}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                Quá hạn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {task.assignee?.avatar ? (
                              <img 
                                src={task.assignee.avatar} 
                                alt={task.assignee.fullName} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-500">
                                {task.assignee?.fullName?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-900 truncate" title={task.assignee?.fullName || 'Chưa phân công'}>
                            {task.assignee?.fullName || 'Chưa phân công'}
                          </span>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        <span className={`text-sm font-medium ${getPriorityColor(task.priority || '')}`}>
                          {getPriorityText(task.priority || '')}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="col-span-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 text-center">
                        {canModify && (
                          <div className="flex items-center justify-center space-x-1">
                            {task.status !== 'COMPLETED' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await taskService.updateTaskStatus(task.id, 'COMPLETED');
                                    if (response.code === 200 && response.data) {
                                      handleTaskUpdate(response.data);
                                    }
                                  } catch (error) {
                                    console.error('Failed to update task status:', error);
                                  }
                                }}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                                title="Hoàn thành"
                              >
                                ✓
                              </button>
                            )}
                            {task.status === 'TO_DO' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await taskService.updateTaskStatus(task.id, 'IN_PROGRESS');
                                    if (response.code === 200 && response.data) {
                                      handleTaskUpdate(response.data);
                                    }
                                  } catch (error) {
                                    console.error('Failed to update task status:', error);
                                  }
                                }}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Bắt đầu"
                              >
                                ▶
                              </button>
                            )}
                            {task.status === 'COMPLETED' && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const response = await taskService.updateTaskStatus(task.id, 'IN_PROGRESS');
                                    if (response.code === 200 && response.data) {
                                      handleTaskUpdate(response.data);
                                    }
                                  } catch (error) {
                                    console.error('Failed to update task status:', error);
                                  }
                                }}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Mở lại"
                              >
                                ↻
                              </button>
                            )}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!confirm('Bạn có chắc chắn muốn xóa task này?')) return;
                                try {
                                  const response = await taskService.deleteTask(task.id);
                                  if (response.code === 200) {
                                    handleTaskDelete(task.id);
                                  }
                                } catch (error) {
                                  console.error('Failed to delete task:', error);
                                }
                              }}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                              title="Xóa"
                            >
                              🗑
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <TaskCreateForm
          onClose={() => setShowCreateForm(false)}
          onTaskCreated={handleTaskCreated}
          targetType="GLOBAL"
          targetId={0}
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
    </>
  );
};

export default TaskPage; 