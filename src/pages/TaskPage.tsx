import React, { useState, useEffect, useMemo } from 'react';
import { useNavigationActions } from '../utils/navigation.utils';
import { useProfileStore } from '../stores/profile-store';
import { useTaskStore } from '../stores/task-store';
import { useTaskAutoRefresh } from '../hooks/useTaskAutoRefresh';
import { UserAvatarName } from '../components/shared/UserAvatarName';
import { AutoRefreshControl } from '../components/shared/AutoRefreshControl';
import taskService from '../services/task.service';
import type { TaskResponse } from '../types/task';
import { Plus, FileText, Paperclip, BarChart3, Clock, CheckCircle, Users, Calendar, AlertTriangle, Play, RotateCcw, Trash2 } from 'lucide-react';
import TaskCreateForm from '../components/tasks/TaskCreateForm.tsx';
import SimpleToast from '../components/utils/SimpleToast.tsx';

const TaskPage: React.FC = () => {
  const { handleTaskClick } = useNavigationActions();
  const { user } = useProfileStore();
  const { 
    tasks, 
    myAssignedTasks, 
    myCreatedTasks, 
    isLoading,
    fetchAllTasks,
    fetchMyAssignedTasks,
    fetchMyCreatedTasks,
    updateTaskInList,
    removeTask
  } = useTaskStore();
  
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks' | 'assigned'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(3600000); // 60 phút

  // Auto refresh cho tasks - memoize refreshType để tránh re-render
  const refreshType = useMemo(() => {
    switch (activeTab) {
      case 'my-tasks': return 'assigned';
      case 'assigned': return 'created';
      default: return 'all';
    }
  }, [activeTab]);

  const autoRefresh = useTaskAutoRefresh({
    enabled: true,
    interval: refreshInterval,
    refreshType
  });

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const fetchTasks = async () => {
    try {
      switch (activeTab) {
        case 'my-tasks':
          await fetchMyAssignedTasks();
          break;
        case 'assigned':
          await fetchMyCreatedTasks();
          break;
        default:
          await fetchAllTasks();
          break;
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setToast({ message: 'Có lỗi xảy ra khi tải danh sách task', type: 'error' });
    }
  };

  // Get current tasks based on active tab
  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'my-tasks':
        return myAssignedTasks;
      case 'assigned':
        return myCreatedTasks;
      default:
        return tasks;
    }
  };

  const currentTasks = getCurrentTasks();

  const handleTaskUpdate = (updatedTask: TaskResponse) => {
    updateTaskInList(updatedTask);
    setToast({ message: 'Cập nhật task thành công!', type: 'success' });
  };

  const handleTaskDelete = (taskId: number) => {
    removeTask(taskId);
    setToast({ message: 'Xóa task thành công!', type: 'success' });
  };

  const handleTaskCreated = async (newTask: TaskResponse) => {
    // The store's createTask method will automatically add to the appropriate lists
    setToast({ message: 'Tạo task thành công!', type: 'success' });
    // Refresh the current view
    await fetchTasks();
  };

  const getTaskStats = () => {
    return {
      total: currentTasks.length,
      inProgress: currentTasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: currentTasks.filter(t => t.status === 'COMPLETED').length,
      toDo: currentTasks.filter(t => t.status === 'TO_DO').length
    };
  };

  const stats = getTaskStats();

  return (
    <>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                 style={{
                   background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                 }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Quản lý công việc
              </h1>
              <p className="text-sm text-gray-600">Theo dõi và quản lý các task của dự án</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Tổng số task</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
            
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Chưa bắt đầu</p>
                <p className="text-2xl font-bold text-gray-700">{stats.toDo}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Đang thực hiện</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border border-white/20 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          </div>

                  {/* Tabs and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 shadow-md border border-white/20">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'all'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
              style={activeTab === 'all' ? {
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
              } : {}}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'my-tasks'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
              style={activeTab === 'my-tasks' ? {
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
              } : {}}
            >
              Task của tôi
            </button>
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'assigned'
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
              style={activeTab === 'assigned' ? {
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
              } : {}}
            >
              Task tôi giao
            </button>
          </div>
          
          <button 
            onClick={() => setShowCreateForm(true)}
            className="text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 font-medium"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo task mới</span>
          </button>
        </div>

        {/* Auto Refresh Control */}
        <div className="mb-4">
          <AutoRefreshControl
            isRefreshing={autoRefresh.isRefreshing}
            isActive={autoRefresh.isAutoRefreshActive}
            lastRefreshTime={autoRefresh.lastRefreshTime}
            onToggle={autoRefresh.toggleAutoRefresh}
            onRefreshNow={autoRefresh.refreshNow}
            onIntervalChange={setRefreshInterval}
            currentInterval={refreshInterval}
            compact={true}
          />
        </div>

                  {/* Task List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
            <h2 className="text-lg font-bold text-gray-900">
              {activeTab === 'all' && 'Tất cả task'}
              {activeTab === 'my-tasks' && 'Task của tôi'}
              {activeTab === 'assigned' && 'Task tôi giao'}
              <span className="ml-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {currentTasks.length} task
              </span>
            </h2>
          </div>
          
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                       style={{
                         borderTopColor: '#3B82F6',
                         borderRightColor: '#8B5CF6',
                         borderBottomColor: '#EC4899'
                       }}>
                  </div>
                </div>
                <p className="text-gray-600 font-medium">Đang tải danh sách task...</p>
              </div>
            ) : currentTasks.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                     style={{
                       background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                     }}>
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Không có task nào</h3>
                <p className="text-gray-600 mb-6">Chưa có task nào thuộc danh mục này.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                  }}
                >
                  Tạo task đầu tiên
                </button>
              </div>
            ) : (
              /* Tasks List */
              <div className="divide-y divide-gray-100">
                {/* Table Header */}
                            <div className="px-6 py-3 bg-gradient-to-r from-gray-50/80 to-blue-50/50 border-b border-gray-200/50">
              <div className="grid grid-cols-12 gap-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                <div className="col-span-4">Task</div>
                <div className="col-span-2">Người được giao</div>
                <div className="col-span-2">Hạn hoàn thành</div>
                <div className="col-span-1">Độ ưu tiên</div>
                <div className="col-span-1">Trạng thái</div>
                <div className="col-span-2 text-center">Thao tác</div>
              </div>
            </div>

              {/* Table Body */}
              {currentTasks.map((task) => {
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
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 transition-all duration-300 cursor-pointer group border-l-4 border-transparent hover:border-blue-400 hover:shadow-sm"
                      onClick={() => handleTaskClick(task.id)}
                      >
                    <div className="px-6 py-4 grid grid-cols-12 gap-3 items-center">
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
                            {task.hasFiles && (
                              <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded" title={`Có ${task.files?.length || 0} file đính kèm`}>
                                <Paperclip className="w-3 h-3 mr-1" />
                                {task.files?.length ? `${task.files.length} files` : 'Files'}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Quá hạn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="col-span-2">
                        {task.assignee ? (
                          <UserAvatarName 
                            user={task.assignee}
                            size="sm"
                            clickable={true}
                          />
                        ) : (
                          <span className="text-sm text-gray-500">Chưa phân công</span>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <div className={`inline-flex items-center text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(task.dueDate)}
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="col-span-1">
                        <div className={`inline-flex items-center text-sm font-medium ${getPriorityColor(task.priority || '')}`}>
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {getPriorityText(task.priority || '')}
                        </div>
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
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg text-xs hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
                                title="Hoàn thành"
                              >
                                <CheckCircle className="w-4 h-4" />
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
                                className="text-white px-3 py-2 rounded-lg text-xs hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
                                style={{
                                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                                }}
                                title="Bắt đầu"
                              >
                                <Play className="w-4 h-4" />
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
                                className="text-white px-3 py-2 rounded-lg text-xs hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
                                style={{
                                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                                }}
                                title="Mở lại"
                              >
                                <RotateCcw className="w-4 h-4" />
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
                              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-2 rounded-lg text-xs hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
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