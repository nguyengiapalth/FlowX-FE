import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import { useDepartmentStore } from '../stores/department-store';
import { OnlineStatus } from '../components/utils/OnlineStatus';
import { useUserPresence } from '../hooks/useUserPresence';
import userService from '../services/user.service';
import departmentService from '../services/department.service';
import Toast from '../components/utils/Toast.tsx';
import type { UserResponse, UserCreateRequest } from '../types/user';
import type { DepartmentResponse } from '../types/department';

import { formatDate } from '../utils/format.util';
import { 
  Plus, 
  Search, 
  Users, 
  Shield, 
  User 
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  fullName: string;
  avatar?: string;
  phoneNumber?: string;
  position?: string;
  departmentId?: number;
  departmentName?: string;
  status: string;
  createdAt: string;
}

interface UserFormData {
  email: string;
  fullName: string;
  phoneNumber: string;
  position: string;
  status: string;
}

const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useProfileStore();
  const { isGlobalManager, isDepartmentManager } = useAuthStore();
  const { isUserOnline } = useUserPresence();
  const [searchTerm, setSearchTerm] = useState('');
  const { departments } = useDepartmentStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangeDepartmentModal, setShowChangeDepartmentModal] = useState(false);
  const [showChangePositionModal, setShowChangePositionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    fullName: '',
    phoneNumber: '',
    position: '',
    status: 'ACTIVE'
  });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'none'>('none');
  const [newPosition, setNewPosition] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info'; visible: boolean }>({
    message: '',
    type: 'info',
    visible: false
  });

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message, type, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  // Handle view profile
  const handleViewProfile = (userId: number) => {
    if (userId === currentUser?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load departments and users in parallel
      const [usersResponse, departmentsResponse] = await Promise.all([
        userService.getAllUsers(),
        departmentService.getAllDepartments()
      ]);
      
      // Process departments
      if (departmentsResponse.code === 200 && departmentsResponse.data) {
        setDepartments(departmentsResponse.data);
      }
      
      // Process users
      if (usersResponse.code === 200 && usersResponse.data) {
        const transformedUsers: User[] = usersResponse.data.map((user: UserResponse) => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          position: user.position,
          departmentId: user.department?.id,
          departmentName: user.department?.name,
          status: user.status || 'ACTIVE',
          createdAt: user.createdAt
        }));
        setUsers(transformedUsers);
      } else {
        setError(usersResponse.message || 'Không thể tải danh sách nhân sự.');
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.email.trim() || !formData.fullName.trim()) {
      showToast('Vui lòng nhập email và họ tên', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: UserCreateRequest = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined,
        position: formData.position.trim() || undefined,
        status: formData.status as any
      };

      const response = await userService.createUser(request);
      
      if (response.code === 200 || response.code === 201) {
        showToast('Tạo nhân sự thành công!', 'success');
        setShowCreateModal(false);
        resetForm();
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi tạo nhân sự', 'error');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      showToast('Không thể tạo nhân sự. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      fullName: '',
      phoneNumber: '',
      position: '',
      status: 'ACTIVE'
    });
  };

  // Permission checks
  const canManageUser = (user: User): boolean => {
    if (isGlobalManager()) return true;
    const userDepartmentId = currentUser?.department?.id;
    if (userDepartmentId && isDepartmentManager(userDepartmentId) && user.departmentId === userDepartmentId) {
      return true;
    }
    if (user.id === currentUser?.id) return false;
    return false;
  };

  const canCreateUser = (): boolean => {
    return isGlobalManager() || isDepartmentManager();
  };

  const filteredUsers = users.filter(user => {
    // Access control
    const userDepartmentId = currentUser?.department?.id;
    
    if (isGlobalManager()) {
      // Global managers can see all users
    } else if (userDepartmentId && isDepartmentManager(userDepartmentId)) {
      if (user.departmentId !== userDepartmentId && user.id !== currentUser?.id) {
        return false;
      }
    } else {
      if (user.departmentId !== userDepartmentId && user.id !== currentUser?.id) {
        return false;
      }
    }
    
    // Filters
    if (statusFilter !== 'all' && user.status !== statusFilter) {
      return false;
    }
    
    if (departmentFilter !== 'all' && user.departmentId !== departmentFilter) {
      return false;
    }
    
    return user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (user.position && user.position.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'INACTIVE': return 'Ngưng hoạt động';
      case 'SUSPENDED': return 'Tạm ngưng';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenChangeDepartment = (user: User) => {
    setSelectedUser(user);
    setSelectedDepartmentId(user.departmentId || 'none');
    setShowChangeDepartmentModal(true);
  };

  const handleChangeDepartment = async () => {
    if (!selectedUser) return;

    // Check if there's actually a change
    const currentDeptId = selectedUser.departmentId || 'none';
    if (currentDeptId === selectedDepartmentId) {
      showToast('Phòng ban đã được chọn giống như hiện tại', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const departmentId = selectedDepartmentId === 'none' ? 0 : selectedDepartmentId as number;
      
      const response = await userService.updateUserDepartment(selectedUser.id, departmentId);
      
      if (response.code === 200 && response.data) {
        showToast('Thay đổi phòng ban thành công!', 'success');
        setShowChangeDepartmentModal(false);
        setSelectedUser(null);
        setSelectedDepartmentId('none');
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi thay đổi phòng ban', 'error');
      }
    } catch (err) {
      console.error('Failed to change department:', err);
      showToast('Không thể thay đổi phòng ban. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChangePosition = (user: User) => {
    setSelectedUser(user);
    setNewPosition(user.position || '');
    setShowChangePositionModal(true);
  };

  const handleChangePosition = async () => {
    if (!selectedUser) return;

    // Check if there's actually a change
    const currentPosition = selectedUser.position || '';
    if (currentPosition === newPosition.trim()) {
      showToast('Chức vụ đã được nhập giống như hiện tại', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await userService.updateUserPosition(selectedUser.id, newPosition.trim());
      
      if (response.code === 200 && response.data) {
        showToast('Thay đổi chức vụ thành công!', 'success');
        setShowChangePositionModal(false);
        setSelectedUser(null);
        setNewPosition('');
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi thay đổi chức vụ', 'error');
      }
    } catch (err) {
      console.error('Failed to change position:', err);
      showToast('Không thể thay đổi chức vụ. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quản lý nhân sự</h1>
          <p className="text-gray-600">
            Quản lý thông tin nhân viên trong công ty. Theo dõi và cập nhật thông tin cá nhân, vị trí công việc.
          </p>
        </div>
        
        {canCreateUser() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Thêm nhân sự</span>
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
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, chức vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
              <option value="SUSPENDED">Tạm ngưng</option>
            </select>
          </div>

          {/* Department Filter */}
          {isGlobalManager() && (
            <div className="w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tất cả phòng ban</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Nhân sự</div>
            <div className="col-span-2">Chức vụ</div>
            <div className="col-span-2">Phòng ban</div>
            <div className="col-span-1">Liên hệ</div>
            <div className="col-span-1">Trạng thái</div>
            <div className="col-span-3 text-center">Thao tác</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="hover:bg-gray-50 transition-colors">
              <div className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                {/* User Info */}
                <div className="col-span-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all flex-shrink-0"
                      onClick={() => handleViewProfile(user.id)}
                      title="Click để xem profile"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-semibold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p 
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                        onClick={() => handleViewProfile(user.id)}
                        title={user.fullName}
                      >
                        {user.fullName}
                      </p>
                      <p className="text-sm text-gray-500 truncate" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Position */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-900 truncate" title={user.position || ''}>
                    {user.position || '-'}
                  </p>
                </div>

                {/* Department */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-900 truncate" title={user.departmentName || ''}>
                    {user.departmentName || '-'}
                  </p>
                </div>

                {/* Contact */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-900 truncate" title={user.phoneNumber || ''}>
                    {user.phoneNumber || '-'}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <div className="space-y-1">
                    {/* Account Status */}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                    {/* Online Presence Status */}
                    <div className="flex items-center space-x-1">
                      <OnlineStatus userId={user.id} size="sm" />
                      <span className="text-xs text-gray-600">
                        {isUserOnline(user.id) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-3 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <button
                      onClick={() => handleViewProfile(user.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                      title="Xem profile"
                    >
                      Xem
                    </button>
                    {isGlobalManager() && (
                      <button 
                        onClick={() => handleOpenChangeDepartment(user)}
                        className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                        title="Thay đổi phòng ban"
                      >
                        Phòng ban
                      </button>
                    )}
                    {(isGlobalManager() || isDepartmentManager()) && canManageUser(user) && (
                      <button 
                        onClick={() => handleOpenChangePosition(user)}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                        title="Thay đổi chức vụ"
                      >
                        Chức vụ
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State in Table */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0H21v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy nhân sự</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác.' : 'Hiện tại chưa có nhân sự nào phù hợp.'}
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhân sự</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
            <div className="text-sm text-gray-600">Tổng nhân sự</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredUsers.filter(u => u.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Đang hoạt động</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {filteredUsers.filter(u => u.status === 'INACTIVE').length}
            </div>
            <div className="text-sm text-gray-600">Ngưng hoạt động</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {departments.length}
            </div>
            <div className="text-sm text-gray-600">Phòng ban</div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm nhân sự mới</h2>
            
            {/* Auto password notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Mật khẩu tự động</p>
                  <p className="text-blue-700 mt-1">
                    Mật khẩu sẽ được tạo tự động và gửi về email của nhân sự mới.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chức vụ
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập chức vụ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Ngưng hoạt động</option>
                  <option value="SUSPENDED">Tạm ngưng</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo nhân sự'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Department Modal */}
      {showChangeDepartmentModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thay đổi phòng ban
            </h2>
            
            {/* User info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-semibold">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400">
                    Phòng ban hiện tại: {selectedUser.departmentName || 'Chưa phân công'}
                  </p>
                </div>
              </div>
            </div>

            {/* Department selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn phòng ban mới
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value === 'none' ? 'none' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">Không thuộc phòng ban nào</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            {/* Info notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Lưu ý</p>
                  <p className="text-blue-700 mt-1">
                    Thay đổi phòng ban sẽ cập nhật quyền truy cập của nhân viên và gửi thông báo.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowChangeDepartmentModal(false);
                  setSelectedUser(null);
                  setSelectedDepartmentId('none');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleChangeDepartment}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Position Modal */}
      {showChangePositionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thay đổi chức vụ
            </h2>
            
            {/* User info */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-semibold">
                      {selectedUser.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400">
                    Chức vụ hiện tại: {selectedUser.position || 'Chưa phân công'}
                  </p>
                </div>
              </div>
            </div>

            {/* Position input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn chức vụ mới
              </label>
              <input
                type="text"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập chức vụ"
              />
            </div>

            {/* Info notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-blue-800 font-medium">Lưu ý</p>
                  <p className="text-blue-700 mt-1">
                    Thay đổi chức vụ sẽ cập nhật quyền truy cập của nhân viên và gửi thông báo.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowChangePositionModal(false);
                  setSelectedUser(null);
                  setNewPosition('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleChangePosition}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default UserListPage;
