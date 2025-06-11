import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import projectService from '../services/project.service';
import departmentService from '../services/department.service';
import Toast from '../components/utils/Toast.tsx';
import type { ProjectResponse, ProjectCreateRequest, ProjectUpdateRequest } from '../types/project';
import type { DepartmentResponse } from '../types/department';
import type { UserResponse } from '../types/user';
import type { ProjectStatus, PriorityLevel } from '../types/enums/enums';
import userService from '../services/user.service';
import {
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FolderOpen,
  Filter
} from 'lucide-react';
import {formatDate} from "../utils/format.util.ts";

interface Project {
  id: number;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  departmentId: number;
  departmentName: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  isJoined: boolean;
  createdAt: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  departmentId: number;
  status: ProjectStatus;
  priority: PriorityLevel;
  memberIds: number[];
}

const ProjectListPage: React.FC = () => {
  const { user } = useProfileStore();
  const { isGlobalManager, isDepartmentManager, canAccessAllProjectsInDepartment } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'discover' | 'active' | 'completed' | 'paused'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
  
  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    departmentId: 0,
    status: 'NOT_STARTED' as ProjectStatus,
    priority: 'MEDIUM' as PriorityLevel,
    memberIds: []
  });
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

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load departments, projects, and users in parallel
      const [projectsResponse, departmentsResponse, usersResponse] = await Promise.all([
        projectService.getMyProjects(),
        departmentService.getAllDepartments(),
        userService.getAllUsers()
      ]);
      
      // Process departments
      if (departmentsResponse.code === 200 && departmentsResponse.data) {
        setDepartments(departmentsResponse.data);
      }
      
      // Process users
      if (usersResponse.code === 200 && usersResponse.data) {
        setUsers(usersResponse.data);
      }
      
      // Process projects
      if (projectsResponse.code === 200 && projectsResponse.data) {
        const transformedProjects: Project[] = projectsResponse.data.map((proj: ProjectResponse) => ({
          id: proj.id,
          name: proj.name,
          description: proj.description || '',
          startDate: proj.startDate,
          endDate: proj.endDate,
          departmentId: proj.department.id,
          departmentName: proj.department.name,
          status: proj.status,
          priority: proj.priority,
          isJoined: false, // TODO: Get from project members API when available
          createdAt: proj.createdAt
        }));
        setProjects(transformedProjects);
      } else {
        setError(projectsResponse.message || 'Không thể tải danh sách dự án.');
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên dự án', 'warning');
      return;
    }
    if (!formData.departmentId) {
      showToast('Vui lòng chọn phòng ban', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: ProjectCreateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        departmentId: formData.departmentId,
        createdById: user?.id || 0,
        status: formData.status,
        priority: formData.priority,
        memberIds: formData.memberIds
      };

      const response = await projectService.createProject(request);
      
      if (response.code === 200 || response.code === 201) {
        showToast('Tạo dự án thành công!', 'success');
        setShowCreateModal(false);
        resetForm();
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi tạo dự án', 'error');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      showToast('Không thể tạo dự án. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !formData.name.trim()) {
      showToast('Vui lòng nhập tên dự án', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: ProjectUpdateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        status: formData.status,
        priority: formData.priority
      };

      const response = await projectService.updateProject(selectedProject.id, request);
      
      if (response.code === 200) {
        showToast('Cập nhật dự án thành công!', 'success');
        setShowEditModal(false);
        setSelectedProject(null);
        resetForm();
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi cập nhật dự án', 'error');
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      showToast('Không thể cập nhật dự án. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      setIsSubmitting(true);
      const response = await projectService.deleteProject(selectedProject.id);
      
      if (response.code === 200 || response.code === 204) {
        showToast('Xóa dự án thành công!', 'success');
        setShowDeleteModal(false);
        setSelectedProject(null);
        await loadInitialData();
      } else {
        showToast(response.message || 'Có lỗi xảy ra khi xóa dự án', 'error');
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      showToast('Không thể xóa dự án. Vui lòng thử lại.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    // Set default department for non-global managers
    if (!isGlobalManager() && user?.department?.id) {
      setFormData(prev => ({ ...prev, departmentId: user.department!.id }));
    }
    setShowCreateModal(true);
  };

  const openEditModal = (project: Project) => {
    // Convert Project to ProjectResponse for state compatibility
    const projectResponse: ProjectResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      department: {
        id: project.departmentId,
        name: project.departmentName,
        createdAt: '',
        updatedAt: ''
      },
      status: project.status,
      priority: project.priority,
      createdAt: project.createdAt,
      updatedAt: ''
    };
    setSelectedProject(projectResponse);
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      departmentId: project.departmentId,
      status: project.status,
      priority: project.priority,
      memberIds: []
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: Project) => {
    // Convert Project to ProjectResponse for state compatibility
    const projectResponse: ProjectResponse = {
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      department: {
        id: project.departmentId,
        name: project.departmentName,
        createdAt: '',
        updatedAt: ''
      },
      status: project.status,
      priority: project.priority,
      createdAt: project.createdAt,
      updatedAt: ''
    };
    setSelectedProject(projectResponse);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      departmentId: 0,
      status: 'NOT_STARTED' as ProjectStatus,
      priority: 'MEDIUM' as PriorityLevel,
      memberIds: []
    });
  };

  // Permission checks
  const canManageProject = (project: Project): boolean => {
    // Global managers can manage all projects
    if (isGlobalManager()) return true;
    
    // Department managers can manage projects in their department
    const userDepartmentId = user?.department?.id;
    if (userDepartmentId && isDepartmentManager(userDepartmentId) && project.departmentId === userDepartmentId) {
      return true;
    }
    
    return false;
  };

  const canCreateProject = (): boolean => {
    // Global managers and department managers can create projects
    return isGlobalManager() || isDepartmentManager();
  };

  const filteredProjects = projects
    .filter(project => {
      // Access control based on role and department
      const userDepartmentId = user?.department?.id;
      
      // Global managers can see all projects
      if (isGlobalManager()) {
        // No additional filtering needed
      }
      // Department managers can see all projects in their department
      else if (userDepartmentId && canAccessAllProjectsInDepartment(project.departmentId)) {
        // Allow all projects in their department
      }
      // Regular users can only see their own projects (isJoined)
      else if (!project.isJoined && project.departmentId !== userDepartmentId) {
        return false;
      }
      
      // Department filter
      if (departmentFilter !== 'all' && project.departmentId !== departmentFilter) {
        return false;
      }
      
      // Status filters
      if (filter === 'joined') return project.isJoined;
      if (filter === 'discover') return !project.isJoined;
      if (filter === 'active') return project.status === 'IN_PROGRESS';
      if (filter === 'completed') return project.status === 'COMPLETED';
      if (filter === 'paused') return project.status === 'ON_HOLD';
      return true;
    })
    .filter(project => project.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'NOT_STARTED': return 'Chưa bắt đầu';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'ON_HOLD': return 'Tạm dừng';
      case 'CANCELLED': return 'Hủy bỏ';
      default: return status;
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'NOT_STARTED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: PriorityLevel) => {
    switch (priority) {
      case 'LOW': return 'Thấp';
      case 'MEDIUM': return 'Trung bình';
      case 'HIGH': return 'Cao';
      case 'URGENT': return 'Khẩn cấp';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dự án</h1>
        <p className="text-gray-600">
          Quản lý và theo dõi tiến độ các dự án trong công ty. Tham gia vào các dự án và cộng tác với team.
        </p>
      </div>
        
        {/* Add Project Button - Only for Global Managers and Department Managers */}
        {canCreateProject() && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm dự án</span>
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
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm dự án..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('joined')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'joined'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Đã tham gia
            </button>
            <button
              onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Đang thực hiện
            </button>
            <button
              onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Hoàn thành
            </button>
            <button
              onClick={() => setFilter('discover')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filter === 'discover'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Khám phá
            </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              
              {/* Management Actions - Only for managers who can manage this project */}
              {canManageProject(project) && (
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(project)}
                    className="bg-red-500 bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Status badges */}
              <div className="absolute bottom-2 left-2 flex space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {getPriorityText(project.priority)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{project.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                </div>
                  {project.isJoined && (
                  <div className="ml-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Đã tham gia
                    </span>
                  </div>
                  )}
              </div>

              {/* Department */}
              <div className="text-sm text-gray-600 mb-3">
                <span className="font-medium">Phòng ban:</span> {project.departmentName}
              </div>

              {/* Dates */}
              <div className="text-sm text-gray-500 mb-4">
                <div>Bắt đầu: {formatDate(project.startDate)}</div>
                <div>Kết thúc: {formatDate(project.endDate)}</div>
              </div>

              {/* Action Button */}
              <div className="flex space-x-2">
                <Link
                  to={`/project/${project.id}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                >
                  Xem chi tiết
                </Link>
                {!project.isJoined && project.status === 'IN_PROGRESS' && (
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Tham gia
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy dự án</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Thử tìm kiếm với từ khóa khác.' : 'Hiện tại chưa có dự án nào phù hợp.'}
          </p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê tổng quan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{filteredProjects.length}</div>
            <div className="text-sm text-gray-600">Tổng dự án</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredProjects.filter(p => p.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-gray-600">Đang thực hiện</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredProjects.filter(p => p.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-gray-600">Hoàn thành</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {filteredProjects.filter(p => p.isJoined).length}
            </div>
            <div className="text-sm text-gray-600">Đã tham gia</div>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thêm dự án mới</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên dự án"
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
                  placeholder="Nhập mô tả dự án"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isGlobalManager() && !!user?.department?.id}
                >
                  <option value={0}>Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NOT_STARTED">Chưa bắt đầu</option>
                    <option value="IN_PROGRESS">Đang thực hiện</option>
                    <option value="ON_HOLD">Tạm dừng</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy bỏ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ ưu tiên
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>
              </div>
              
              {/* Members Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thành viên ban đầu
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                  {users.length > 0 ? users.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 mb-2 last:mb-0">
                      <input
                        type="checkbox"
                        checked={formData.memberIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              memberIds: [...prev.memberIds, user.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              memberIds: prev.memberIds.filter(id => id !== user.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {user.fullName} ({user.email})
                      </span>
                    </label>
                  )) : (
                    <p className="text-sm text-gray-500">Đang tải danh sách người dùng...</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Đã chọn {formData.memberIds.length} thành viên
                </p>
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
                onClick={handleCreateProject}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Tạo dự án'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Chỉnh sửa dự án</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên dự án <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên dự án"
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
                  placeholder="Nhập mô tả dự án"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NOT_STARTED">Chưa bắt đầu</option>
                    <option value="IN_PROGRESS">Đang thực hiện</option>
                    <option value="ON_HOLD">Tạm dừng</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Hủy bỏ</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Độ ưu tiên
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <span className="font-medium">Phòng ban:</span> {selectedProject.department.name}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleEditProject}
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
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Xác nhận xóa</h2>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa dự án <strong>{selectedProject.name}</strong>? 
              Hành động này không thể hoàn tác.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProject(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xóa...' : 'Xóa dự án'}
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

export default ProjectListPage; 