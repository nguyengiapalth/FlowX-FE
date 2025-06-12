import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import departmentService from '../services/department.service';
import Toast from '../components/utils/Toast.tsx';
import DepartmentManageModal from '../components/utils/DepartmentManageModal';
import type { DepartmentResponse, DepartmentCreateRequest } from '../types/department';
import { formatDate } from '../utils/format.util';
import {Plus, Search, Building2, Users, Edit, Trash2, ChevronRight} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  description: string;
  coverImage?: string;
  isJoined: boolean;
  createdAt: string;
}

const DepartmentListPage: React.FC = () => {
  const { user } = useProfileStore();
  const { canAccessDepartment, isGlobalManager } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'discover'>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentResponse | null>(null);
  const [formData, setFormData] = useState<DepartmentCreateRequest>({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const loadDepartments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await departmentService.getAllDepartments();
      
      if (response.code === 200 && response.data) {
        // Transform API response to match component interface
        const transformedDepartments: Department[] = response.data.map((dept: DepartmentResponse) => ({
          id: dept.id,
          name: dept.name,
          description: dept.description || '',
          coverImage: dept.background, // Default image
          isJoined: user?.department?.id === dept.id,
          createdAt: dept.createdAt
        }));
        setDepartments(transformedDepartments);
      } else {
        setError(response.message || 'Không thể tải danh sách phòng ban.');
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
      setError('Không thể tải danh sách phòng ban. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên phòng ban', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: DepartmentCreateRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      };

      const response = await departmentService.createDepartment(request);
      
      if (response.code === 200 || response.code === 201) {
        showToast('Tạo phòng ban thành công!', 'success');
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
        await loadDepartments();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi tạo phòng ban', 'error');
      }
    } catch (err) {
      console.error('Failed to create department:', err);
      showToast('Không thể tạo phòng ban. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      setIsSubmitting(true);
      const response = await departmentService.deleteDepartment(selectedDepartment.id);
      
      if (response.code === 200 || response.code === 204) {
        showToast('Xóa phòng ban thành công!', 'success');
        setShowDeleteModal(false);
        setSelectedDepartment(null);
        await loadDepartments();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi xóa phòng ban', 'error');
      }
    } catch (err) {
      console.error('Failed to delete department:', err);
      showToast('Không thể xóa phòng ban. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageModal = (deptResponse: DepartmentResponse) => {
    setSelectedDepartment(deptResponse);
    setShowManageModal(true);
  };

  const openDeleteModal = (deptResponse: DepartmentResponse) => {
    // Convert Department to DepartmentResponse for consistency
    setSelectedDepartment(deptResponse);
    setShowDeleteModal(true);
  };

  const filteredDepartments = departments
    .filter(dept => {
      // Only show departments user has access to
      const userDepartmentId = user?.department?.id;
      if (!canAccessDepartment(dept.id, userDepartmentId)) {
        return false;
      }
      
      if (filter === 'joined') return dept.isJoined;
      if (filter === 'discover') return !dept.isJoined;
      return true;
    })
    .filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-full mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-full mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md gradient-primary">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-primary-text">Phòng ban</h1>
                <p className="text-sm text-gray-600">Quản lý và khám phá các phòng ban trong hệ thống</p>
              </div>
            </div>
            
            {/* Add Department Button - Only for Global Managers */}
            {isGlobalManager() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-gradient text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center space-x-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm phòng ban</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="gradient-primary p-2 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                <p className="text-xs text-gray-600">Tổng số phòng ban</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4">
            <div className="flex items-center space-x-3">
              <div className="gradient-primary p-2 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{departments.filter(d => d.isJoined).length}</p>
                <p className="text-xs text-gray-600">Phòng của tôi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm phòng ban..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'all'
                    ? 'btn-gradient text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('joined')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'joined'
                    ? 'btn-gradient text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Đã tham gia
              </button>
              <button
                onClick={() => setFilter('discover')}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter === 'discover'
                    ? 'btn-gradient text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Khám phá
              </button>
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <div key={department.id} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Cover Image */}
              <div className="h-24 gradient-primary relative">
                {department.coverImage && (
                  <img
                    src={department.coverImage}
                    alt={department.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Management Actions - Only for Global Managers */}
                {isGlobalManager() && (
                  <div className="absolute top-2 right-2 flex space-x-1 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Convert Department to DepartmentResponse
                        const deptResponse: DepartmentResponse = {
                          ...department,
                          updatedAt: department.createdAt // Use createdAt as fallback
                        };
                        openManageModal(deptResponse);
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-1.5 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Convert Department to DepartmentResponse
                        const deptResponse: DepartmentResponse = {
                          ...department,
                          updatedAt: department.createdAt // Use createdAt as fallback
                        };
                        openDeleteModal(deptResponse);
                      }}
                      className="bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white p-1.5 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content - Wrapped with Link for navigation */}
              <Link 
                to={`/department/${department.id}`}
                className="block p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base mb-1 hover:text-blue-600 transition-colors">{department.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{department.description}</p>
                  </div>
                  {department.isJoined && (
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        của bạn
                      </span>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">Ngày tạo:</span> {formatDate(department.createdAt)}
                </div>
                
                {/* Navigation indicator */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-600 font-medium">Xem chi tiết</span>
                  <ChevronRight className="w-3 h-3 text-blue-600" />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDepartments.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
            <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy phòng ban</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác.' : 'Hiện tại chưa có phòng ban nào.'}
            </p>
          </div>
        )}

        {/* Create Department Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              {isGlobalManager() && (<h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm phòng ban mới</h2>)}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên phòng ban <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên phòng ban"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Nhập mô tả phòng ban"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateDepartment}
                  disabled={isSubmitting}
                  className="btn-gradient text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo phòng ban'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDepartment && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận xóa</h2>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa phòng ban "{selectedDepartment.name}"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteDepartment}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

                 {/* Department Manage Modal */}
         {showManageModal && selectedDepartment && (
           <DepartmentManageModal
             department={selectedDepartment}
             isOpen={showManageModal}
             onClose={() => {
               setShowManageModal(false);
               setSelectedDepartment(null);
             }}
             onSuccess={(message) => {
               showToast(message, 'success');
               loadDepartments();
             }}
             onError={(message) => showToast(message, 'error')}
             onDepartmentUpdated={() => {
               // Refresh departments list
               loadDepartments();
             }}
           />
         )}

        {/* Toast Notification */}
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </div>
  );
};

export default DepartmentListPage; 