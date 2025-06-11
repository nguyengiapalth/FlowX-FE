import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import departmentService from '../services/department.service';
import Toast from '../components/utils/Toast.tsx';
import DepartmentManageModal from '../components/utils/DepartmentManageModal';
import type { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '../types/department';
import { formatDate } from '../utils/format.util';
import { useNavigate } from 'react-router-dom';
import { useDepartmentStore } from '../stores/department-store';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2 
} from 'lucide-react';

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

  const handleEditDepartment = async () => {
    if (!selectedDepartment || !formData.name.trim()) {
      showToast('Vui lòng nhập tên phòng ban', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: DepartmentUpdateRequest = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      };

      const response = await departmentService.updateDepartment(selectedDepartment.id, request);
      
      if (response.code === 200) {
        showToast('Cập nhật phòng ban thành công!', 'success');
        setShowManageModal(false);
        setSelectedDepartment(null);
        setFormData({ name: '', description: '' });
        await loadDepartments();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi cập nhật phòng ban', 'error');
      }
    } catch (err) {
      console.error('Failed to update department:', err);
      showToast('Không thể cập nhật phòng ban. Vui lòng thử lại.', 'error');
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
      <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Phòng ban</h1>
          <p className="text-gray-600">
            Quản lý và khám phá các phòng ban trong hệ thống.
            Bạn có thể tạo, chỉnh sửa hoặc xóa phòng ban nếu bạn là quản trị viên.
          </p>
        </div>
        
        {/* Add Department Button - Only for Global Managers */}
        {isGlobalManager() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm phòng ban</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('joined')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'joined'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Đã tham gia
            </button>
            <button
              onClick={() => setFilter('discover')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'discover'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Khám phá
            </button>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              {department.coverImage && (
                <img
                  src={department.coverImage}
                  alt={department.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Management Actions - Only for Global Managers */}
              {isGlobalManager() && (
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => {
                      // Convert Department to DepartmentResponse
                      const deptResponse: DepartmentResponse = {
                        ...department,
                        updatedAt: department.createdAt // Use createdAt as fallback
                      };
                      openManageModal(deptResponse);
                    }}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      // Convert Department to DepartmentResponse
                      const deptResponse: DepartmentResponse = {
                        ...department,
                        updatedAt: department.createdAt // Use createdAt as fallback
                      };
                      openDeleteModal(deptResponse);
                    }}
                    className="bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{department.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{department.description}</p>
                </div>
                {department.isJoined && (
                  <div className="ml-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      của bạn
                    </span>
                  </div>
                )}
              </div>

              {/* Created Date */}
              <div className="text-sm text-gray-500 mb-4">
                <span className="font-medium">Ngày tạo:</span> {formatDate(department.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy phòng ban</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác.' : 'Hiện tại chưa có phòng ban nào.'}
          </p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê tổng quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{departments.length}</div>
            <div className="text-sm text-gray-600">Tổng số phòng ban</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {departments.filter(d => d.isJoined).length}
            </div>
            <div className="text-sm text-gray-600">Đã tham gia</div>
          </div>
        </div>
      </div>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm phòng ban mới</h2>
            
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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mô tả phòng ban"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateDepartment}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo phòng ban'}
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
          onError={(message) => {
            showToast(message, 'error');
          }}
          onDepartmentUpdated={(updatedDept) => {
            // Refresh departments list
            loadDepartments();
          }}
        />
      )}

      {/* Legacy Edit Modal (can be removed) */}
      {false && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chỉnh sửa phòng ban</h2>

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
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mô tả phòng ban"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setSelectedDepartment(null);
                  setFormData({ name: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleEditDepartment}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận xóa</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa phòng ban <strong>{selectedDepartment.name}</strong>? 
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedDepartment(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteDepartment}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xóa...' : 'Xóa phòng ban'}
              </button>
            </div>
          </div>
        </div>
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
  );
};

export default DepartmentListPage; 