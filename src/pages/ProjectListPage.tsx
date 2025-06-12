import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import projectService from '../services/project.service';
import departmentService from '../services/department.service';
import Toast from '../components/utils/Toast.tsx';
import { ProjectCreateModal } from '../components/shared/ProjectCreateModal';
import type { ProjectResponse, ProjectUpdateRequest } from '../types/project';
import type { DepartmentResponse } from '../types/department';
import type { ProjectStatus, PriorityLevel } from '../types/enums.ts';
import {
  Plus, 
  Search, 
  Filter,
  Building,
  Calendar,
  Users,
  Edit,
  Trash2,
  Eye,
  ChevronRight
} from 'lucide-react';

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

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useProfileStore();
  const { isGlobalManager, isDepartmentManager, canAccessAllProjectsInDepartment } = useAuthStore();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'joined' | 'discover' | 'active' | 'completed' | 'paused'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
  
  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'NOT_STARTED' as ProjectStatus,
    priority: 'MEDIUM' as PriorityLevel
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
      
      // Load departments and projects in parallel
      const [projectsResponse, departmentsResponse] = await Promise.all([
        projectService.getMyProjects(),
        departmentService.getAllDepartments()
      ]);
      
      // Process departments
      if (departmentsResponse.code === 200 && departmentsResponse.data) {
        setDepartments(departmentsResponse.data);
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

  const handleProjectCreateSuccess = (message: string) => {
    showToast(message, 'success');
    loadInitialData();
  };

  const handleProjectCreateError = (message: string) => {
    showToast(message, 'error');
  };

  const handleEditProject = async () => {
    if (!selectedProject || !editFormData.name.trim()) {
      showToast('Vui lòng nhập tên dự án', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const request: ProjectUpdateRequest = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        startDate: editFormData.startDate || undefined,
        endDate: editFormData.endDate || undefined,
        status: editFormData.status,
        priority: editFormData.priority
      };

      const response = await projectService.updateProject(selectedProject.id, request);
      
      if (response.code === 200) {
        showToast('Cập nhật dự án thành công!', 'success');
        setShowEditModal(false);
        setSelectedProject(null);
        resetEditForm();
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
      
      if (response.code === 200) {
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

  const openEditModal = (project: Project) => {
    setSelectedProject({
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      priority: project.priority,
      department: {
        id: project.departmentId,
        name: project.departmentName
      },
      createdAt: project.createdAt
    } as ProjectResponse);
    
    setEditFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      status: project.status,
      priority: project.priority
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject({
      id: project.id,
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status,
      priority: project.priority,
      department: {
        id: project.departmentId,
        name: project.departmentName
      },
      createdAt: project.createdAt
    } as ProjectResponse);
    setShowDeleteModal(true);
  };

  const resetEditForm = () => {
    setEditFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'NOT_STARTED' as ProjectStatus,
      priority: 'MEDIUM' as PriorityLevel
    });
  };

  const canManageProject = (project: Project): boolean => {
    if (isGlobalManager()) return true;
    if (isDepartmentManager()) {
      return user?.department?.id === project.departmentId;
    }
    return false;
  };

  const canCreateProject = (): boolean => {
    return isGlobalManager() || isDepartmentManager();
  };

  // Filter projects based on search term, filter type, and department
  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Type filter
    let matchesFilter = true;
    switch (filter) {
      case 'joined':
        matchesFilter = project.isJoined;
        break;
      case 'discover':
        matchesFilter = !project.isJoined;
        break;
      case 'active':
        matchesFilter = project.status === 'IN_PROGRESS';
        break;
      case 'completed':
        matchesFilter = project.status === 'COMPLETED';
        break;
      case 'paused':
        matchesFilter = project.status === 'ON_HOLD';
        break;
      default:
        matchesFilter = true;
    }

    // Department filter
    const matchesDepartment = departmentFilter === 'all' || project.departmentId === departmentFilter;

    return matchesSearch && matchesFilter && matchesDepartment;
  });

  const getStatusText = (status: ProjectStatus) => {
    const statusMap = {
      'NOT_STARTED': 'Chưa bắt đầu',
      'IN_PROGRESS': 'Đang thực hiện',
      'ON_HOLD': 'Tạm dừng',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Hủy bỏ'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: ProjectStatus) => {
    const colorMap = {
      'NOT_STARTED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'ON_HOLD': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityText = (priority: PriorityLevel) => {
    const priorityMap: Record<PriorityLevel, string> = {
      'LOW': 'Thấp',
      'MEDIUM': 'Trung bình',
      'HIGH': 'Cao',
      'URGENT': 'Khẩn cấp',
      'CRITICAL': 'Nghiêm trọng'
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    const colorMap: Record<PriorityLevel, string> = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
      'CRITICAL': 'bg-red-200 text-red-900'
    };
    return colorMap[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadInitialData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dự án</h1>
          <p className="mt-2 text-gray-600">Quản lý và theo dõi các dự án của bạn</p>
        </div>
        
        {canCreateProject() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Tạo dự án mới</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter by type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tất cả dự án</option>
              <option value="joined">Đã tham gia</option>
              <option value="discover">Khám phá</option>
              <option value="active">Đang hoạt động</option>
              <option value="completed">Hoàn thành</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </div>

          {/* Filter by department */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dự án nào</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' || departmentFilter !== 'all'
                ? 'Không tìm thấy dự án phù hợp với bộ lọc hiện tại.'
                : 'Chưa có dự án nào được tạo.'}
            </p>
            {canCreateProject() && !searchTerm && filter === 'all' && departmentFilter === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tạo dự án đầu tiên
              </button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    {/* Project Icon */}
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Building className="w-6 h-6 text-blue-600" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          to={`/project/${project.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {project.name}
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {getStatusText(project.status)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                            {getPriorityText(project.priority)}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {project.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{project.departmentName}</span>
                        </div>
                        {project.startDate && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(project.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>0 thành viên</span> {/* TODO: Add member count */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    to={`/project/${project.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-5 h-5" />
                  </Link>

                  {canManageProject(project) && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(project)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Create Modal */}
      <ProjectCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreateSuccess}
        onError={handleProjectCreateError}
      />

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

export default ProjectListPage; 