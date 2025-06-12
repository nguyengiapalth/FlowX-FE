import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useNavigationActions } from '../utils/navigation.utils';
import { 
  LayoutDashboard, 
  ChevronRight, 
  Edit, 
  Plus, 
  UserPlus, 
  X, 
  Building, 
  Loader2 
} from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import { useContentStore } from '../stores/content-store';
import DiscussionSection from '../components/content/DiscussionSection.tsx';
import TaskSection from '../components/tasks/TaskSection.tsx';
import { ExpandableCreateForm } from '../index.ts';
import SimpleToast from '../components/utils/SimpleToast';
import { BackgroundModal } from '../components/shared/BackgroundModal';
import { ContentModal } from '../components/content/ContentModal';
import departmentService from '../services/department.service';
import userService from '../services/user.service';
import projectService from '../services/project.service';
import fileService from '../services/file.service';
import type { DepartmentResponse } from '../types/department';
import type { UserResponse } from '../types/user';
import type { ProjectResponse } from '../types/project';
import type { ContentCreateRequest, ContentResponse } from '../types/content';
import type { FileCreateRequest } from '../types/file';
import { ProjectCreateModal } from '../components/shared/ProjectCreateModal';
import { formatDate } from '../utils/format.util.ts';

const DepartmentDetailPage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const { navigate } = useNavigationActions();
  const { user } = useProfileStore();
  const { canAccessDepartment, isDepartmentManager, isGlobalManager } = useAuthStore();
  const { createContent, syncContentFiles } = useContentStore();
  const [activeTab, setActiveTab] = useState<'members' | 'projects' | 'tasks' | 'discussion' | 'about'>('members');

  // States for real data
  const [departmentData, setDepartmentData] = useState<DepartmentResponse | null>(null);
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Background update states
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  
  // Content detail modal states
  const [selectedContent, setSelectedContent] = useState<ContentResponse | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);

  // Edit mode states for about section
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingManager, setIsEditingManager] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const [editManagerData, setEditManagerData] = useState({
    managerId: null as number | null
  });
  const [departmentUsers, setDepartmentUsers] = useState<UserResponse[]>([]);
  const [currentManager, setCurrentManager] = useState<UserResponse | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Create project modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Check access permission
  const departmentIdNum = parseInt(departmentId || '1');
  const userDepartmentId = user?.department?.id;
  
  if (!canAccessDepartment(departmentIdNum, userDepartmentId)) {
    return <Navigate to="/departments" replace />;
  }

  // Handle view profile
  const handleViewProfile = (userId: number) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  // Handle view content detail
  const handleViewDetail = (_contentId: number, content?: ContentResponse) => {
    if (content) {
      setSelectedContent(content);
      setShowContentModal(true);
    }
  };

  // Handle create department content
  const handleCreateDepartmentContent = async (request: ContentCreateRequest, files?: File[]) => {
    try {
      // First, create the content
      const createdContent = await createContent({
        ...request,
        contentTargetType: 'DEPARTMENT',
        targetId: departmentIdNum,
        parentId: -1
      });

      // If there are files, upload them
      if (files && files.length > 0 && createdContent.id) {
        await uploadContentFiles(createdContent.id, files);
        
        // Sync the content to update hasFile flag
        await syncContentFiles(createdContent.id);
      }
      
      setToast({ 
        message: 'Đã chia sẻ thông báo phòng ban thành công!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Failed to create department content:', error);
      setToast({ 
        message: error.message || 'Không thể chia sẻ thông báo. Vui lòng thử lại.', 
        type: 'error' 
      });
      throw error;
    }
  };

  // Background handlers
  const handleBackgroundUpdate = async (objectKey: string) => {
    if (!departmentData) return;
    
    await departmentService.updateDepartmentBackground(departmentData.id, objectKey);
    
    // Refresh department data
    const updatedDept = await departmentService.getDepartmentById(departmentData.id);
    if (updatedDept.data) {
      setDepartmentData(updatedDept.data);
    }
  };

  const handleToastSuccess = (message: string) => {
    setToast({ message, type: 'success' });
  };

  const handleToastError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  // Handle edit mode for basic info
  const startEditInfo = () => {
    if (!departmentData) return;
    setEditFormData({
      name: departmentData.name,
      description: departmentData.description || ''
    });
    setIsEditingInfo(true);
  };

  const cancelEditInfo = () => {
    setIsEditingInfo(false);
    setEditFormData({ name: '', description: '' });
  };

  // Handle edit mode for manager
  const startEditManager = () => {
    if (!departmentData) return;
    setEditManagerData({
      managerId: null // Start with null to indicate "no change" by default
    });
    setIsEditingManager(true);
    // Load department users when starting edit
    loadDepartmentUsers();
  };

  const cancelEditManager = () => {
    setIsEditingManager(false);
    setEditManagerData({ managerId: null });
  };

  const loadDepartmentUsers = async () => {
    if (!departmentData) return;
    setIsLoadingUsers(true);
    try {
      // Get current manager info
      if (departmentData.managerId) {
        const managerResponse = await userService.getUserById(departmentData.managerId);
        if (managerResponse.code === 200 && managerResponse.data) {
          setCurrentManager(managerResponse.data);
        }
      } else {
        setCurrentManager(null);
      }

      // Get all users in system for manager selection
      const usersResponse = await userService.getAllUsers();
      if (usersResponse.code === 200 && usersResponse.data) {
        setDepartmentUsers(usersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load department users:', error);
      setToast({ message: 'Không thể tải danh sách người dùng', type: 'error' });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const saveEditInfo = async () => {
    if (!departmentData) return;
    if (!editFormData.name.trim()) {
      setToast({ message: 'Vui lòng nhập tên phòng ban', type: 'error' });
      return;
    }

    try {
      // Update basic info only
      const infoResponse = await departmentService.updateDepartment(departmentData.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined
      });

      if (infoResponse.code !== 200) {
        throw new Error(infoResponse.message || 'Failed to update department info');
      }

      // Refresh department data
      const refreshResponse = await departmentService.getDepartmentById(departmentData.id);
      if (refreshResponse.code === 200 && refreshResponse.data) {
        setDepartmentData(refreshResponse.data);
      }

      setIsEditingInfo(false);
      setToast({ message: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Failed to update department info:', error);
      setToast({ message: error.message || 'Không thể cập nhật thông tin phòng ban', type: 'error' });
    }
  };

  const saveEditManager = async () => {
    if (!departmentData) return;

    try {
      // Update manager if changed
      if (editManagerData.managerId !== null && editManagerData.managerId !== (departmentData.managerId || 0)) {
        const managerResponse = await departmentService.updateDepartmentManager(departmentData.id, editManagerData.managerId);
        if (managerResponse.code !== 200) {
          throw new Error(managerResponse.message || 'Failed to update manager');
        }
      }

      // Refresh department data
      const refreshResponse = await departmentService.getDepartmentById(departmentData.id);
      if (refreshResponse.code === 200 && refreshResponse.data) {
        setDepartmentData(refreshResponse.data);
        // Refresh current manager info
        if (refreshResponse.data.managerId) {
          const managerResponse = await userService.getUserById(refreshResponse.data.managerId);
          if (managerResponse.code === 200 && managerResponse.data) {
            setCurrentManager(managerResponse.data);
          }
        } else {
          setCurrentManager(null);
        }
      }

      setIsEditingManager(false);
      setToast({ message: 'Cập nhật quản lý thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Failed to update department manager:', error);
      setToast({ message: error.message || 'Không thể cập nhật quản lý phòng ban', type: 'error' });
    }
  };

  // Handle create project
  const handleProjectCreateSuccess = (message: string) => {
    setToast({ message, type: 'success' });
    loadProjectsData();
  };

  const handleProjectCreateError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  const loadProjectsData = async () => {
    try {
      const projectsResponse = await projectService.getProjectsByDepartmentId(departmentIdNum);
      if (projectsResponse.data) {
        setProjects(projectsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const uploadContentFiles = async (contentId: number, files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      try {
        // Step 1: Get presigned upload URL
        const fileRequest: FileCreateRequest = {
          name: file.name,
          type: file.type,
          size: file.size,
          targetId: contentId,
          fileTargetType: 'CONTENT'
        };

        const presignedResponse = await fileService.getPresignedUploadUrl(fileRequest);
        
        if (!presignedResponse.data) {
          throw new Error('No presigned URL returned from server');
        }

        // Step 2: Upload file directly to MinIO using presigned URL
        const uploadResponse = await fetch(presignedResponse.data.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        console.log('File uploaded successfully:', file.name);
        return presignedResponse.data.presignedFileId;
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
  };

  // Load department data
  useEffect(() => {
    const loadData = async () => {
      if (!departmentIdNum) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Load department info, members, and projects in parallel
        const [deptResponse, membersResponse, projectsResponse] = await Promise.all([
          departmentService.getDepartmentById(departmentIdNum),
          userService.getUsersByDepartment(departmentIdNum),
          projectService.getProjectsByDepartmentId(departmentIdNum)
        ]);

        if (deptResponse.data) {
          setDepartmentData(deptResponse.data);
          // Load current manager info
          if (deptResponse.data.managerId) {
            const managerResponse = await userService.getUserById(deptResponse.data.managerId);
            if (managerResponse.code === 200 && managerResponse.data) {
              setCurrentManager(managerResponse.data);
            }
          }
        }
        if (membersResponse.data) setMembers(membersResponse.data);
        if (projectsResponse.data) setProjects(projectsResponse.data);

      } catch (error) {
        console.error('Failed to load department data:', error);
        setError('Không thể tải dữ liệu phòng ban');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [departmentIdNum]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !departmentData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl text-gray-400 mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải thông tin phòng ban</h1>
          <p className="text-gray-600 mb-4">{error || 'Phòng ban không tồn tại hoặc bạn không có quyền truy cập'}</p>
          <button
            onClick={() => navigate('/departments')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Quay lại danh sách phòng ban
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Breadcrumb */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/departments" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Phòng ban
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-6 h-6 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{departmentData.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Department Cover */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        <div 
          className={`relative h-64 ${!departmentData.background ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
          style={{
            backgroundImage: departmentData.background ? `url(${departmentData.background})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >

          {/* Background Edit Button - only shown if user is manager */}
          {isDepartmentManager(departmentIdNum) && (
            <button 
              onClick={() => setShowBackgroundModal(true)}
              className="absolute top-4 right-4 bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-lg flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={departmentData.background ? "Thay đổi ảnh bìa" : "Thêm ảnh bìa"}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">{departmentData.background ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}</span>
            </button>
          )}
          
          {/* Department Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{departmentData.name}</h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span>👥 {members.length} thành viên</span>
                  <span>📋 {projects.length} dự án</span>
                  <span>📅 Tạo ngày {formatDate(departmentData.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'members', label: 'Thành viên', icon: '👥' },
              { key: 'projects', label: 'Dự án', icon: '📋' },
              { key: 'tasks', label: 'Nhiệm vụ', icon: '✅' },
              { key: 'discussion', label: 'Thảo luận', icon: '💬' },
              { key: 'about', label: 'Thông tin', icon: 'ℹ️' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thành viên phòng ban</h2>
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-500">Chưa có thành viên nào trong phòng ban này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                          <img
                            src={member.avatar || '/default-avatar.png'}
                            alt={member.fullName}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            onClick={() => handleViewProfile(member.id)}
                            title="Click để xem profile"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 
                              className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleViewProfile(member.id)}
                              title="Click để xem profile"
                            >
                              {member.fullName}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Thành viên
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-500">{member.position || 'Chưa có chức vụ'}</p>
                            {member.joinDate && (
                              <p className="text-xs text-gray-400">
                                Tham gia: {formatDate(member.joinDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleViewProfile(member.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium ml-4 whitespace-nowrap"
                      >
                        Xem profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Dự án của phòng ban</h2>
              
              {/* Create Project Button - only show to department managers or global managers */}
              {(isDepartmentManager(departmentIdNum) || isGlobalManager()) && (
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo dự án mới</span>
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-500 mb-4">Chưa có dự án nào trong phòng ban này</p>
                
                {/* Create Project Button for empty state - only show to department managers or global managers */}
                {(isDepartmentManager(departmentIdNum) || isGlobalManager()) && (
                  <button
                    onClick={() => setShowCreateProjectModal(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Tạo dự án đầu tiên</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status === 'IN_PROGRESS' ? 'Đang thực hiện' :
                             project.status === 'COMPLETED' ? 'Hoàn thành' : 
                             project.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {project.startDate && (
                            <span>Bắt đầu: {formatDate(project.startDate)}</span>
                          )}
                          {project.endDate && (
                            <span>Kết thúc: {formatDate(project.endDate)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <TaskSection
            targetType="DEPARTMENT"
            targetId={departmentIdNum}
            title="Nhiệm vụ phòng ban"
          />
        )}

        {/* Discussion Tab */}
        {activeTab === 'discussion' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thảo luận phòng ban</h2>
            <div className="mb-6">
              <ExpandableCreateForm
                contentTargetType="DEPARTMENT"
                targetId={departmentIdNum}
                parentId={-1}
                onSubmit={handleCreateDepartmentContent}
                placeholder={`Chia sẻ thông báo hoặc thảo luận với thành viên ${departmentData.name}...`}
                compactPlaceholder={`Chia sẻ với ${departmentData.name}...`}
                autoFocus={false}
              />
            </div>
            <DiscussionSection
              targetType="DEPARTMENT"
              targetId={departmentIdNum}
              title=""
              placeholder={`Chia sẻ với thành viên ${departmentData.name}...`}
              onViewDetail={handleViewDetail}
            />
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin phòng ban</h2>
              
              {/* Edit buttons - show based on permissions */}
              <div className="flex space-x-3">
                {/* Edit basic info button - department managers can do this */}
                {isDepartmentManager(departmentIdNum) && !isEditingInfo && !isEditingManager && (
                  <button
                    onClick={startEditInfo}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa thông tin</span>
                  </button>
                )}
                
                {/* Edit manager button - only global managers can do this */}
                {isGlobalManager() && !isEditingInfo && !isEditingManager && (
                  <button
                    onClick={startEditManager}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Đổi quản lý</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Department Name */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tên phòng ban</h3>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên phòng ban"
                  />
                ) : (
                  <p className="text-gray-600">{departmentData.name}</p>
                )}
              </div>
              
              {/* Department Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mô tả</h3>
                {isEditingInfo ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mô tả phòng ban"
                  />
                ) : (
                  <p className="text-gray-600">{departmentData.description || 'Chưa có mô tả'}</p>
                )}
              </div>

              {/* Department Manager */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Quản lý phòng ban</h3>
                {isEditingManager ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Hiện tại: {currentManager?.fullName || (departmentData.managerId ? 'Đang tải...' : 'Chưa có quản lý')}
                    </p>
                    <select
                      value={editManagerData.managerId === null ? 'current' : editManagerData.managerId === 0 ? 'remove' : editManagerData.managerId.toString()}
                      onChange={(e) => {
                        if (e.target.value === 'current') {
                          setEditManagerData({ managerId: null });
                        } else if (e.target.value === 'remove') {
                          setEditManagerData({ managerId: 0 });
                        } else {
                          setEditManagerData({ managerId: parseInt(e.target.value) });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isLoadingUsers}
                    >
                      <option value="current">Giữ nguyên quản lý hiện tại</option>
                      <option value="remove">Xóa quản lý (không có quản lý)</option>
                      {isLoadingUsers ? (
                        <option disabled>Đang tải danh sách người dùng...</option>
                      ) : (
                        departmentUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} - {user.email} {user.department ? `(${user.department.name})` : '(Chưa có phòng ban)'}
                          </option>
                        ))
                      )}
                    </select>
                    {editManagerData.managerId !== null && editManagerData.managerId !== (departmentData.managerId || 0) && (
                      <p className="text-sm text-blue-600">
                        {editManagerData.managerId === 0 
                          ? '✓ Sẽ xóa quản lý (không có quản lý)'
                          : `✓ Sẽ thay đổi quản lý thành: ${departmentUsers.find(u => u.id === editManagerData.managerId)?.fullName}`
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600">{currentManager?.fullName || 'Chưa có quản lý'}</p>
                )}
              </div>

              {/* Edit mode buttons for basic info */}
              {isEditingInfo && (
                <div className="flex space-x-3">
                  <button
                    onClick={saveEditInfo}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Lưu thông tin
                  </button>
                  <button
                    onClick={cancelEditInfo}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Edit mode buttons for manager */}
              {isEditingManager && (
                <div className="flex space-x-3">
                  <button
                    onClick={saveEditManager}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Lưu quản lý
                  </button>
                  <button
                    onClick={cancelEditManager}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Thống kê</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số thành viên:</span>
                      <span className="font-medium">{members.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số dự án:</span>
                      <span className="font-medium">{projects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-medium">{formatDate(departmentData.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Thông tin chung</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-medium">{formatDate(departmentData.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cập nhật:</span>
                      <span className="font-medium">{formatDate(departmentData.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Background Modal */}
      <BackgroundModal
        isOpen={showBackgroundModal}
        onClose={() => setShowBackgroundModal(false)}
        onSuccess={handleToastSuccess}
        onError={handleToastError}
        title={departmentData.background ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}
        targetType="DEPARTMENT"
        targetId={departmentData.id}
        targetName={departmentData.name}
        onBackgroundUpdate={handleBackgroundUpdate}
      />

      {/* Create Project Modal */}
      <ProjectCreateModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onSuccess={handleProjectCreateSuccess}
        onError={handleProjectCreateError}
        defaultDepartmentId={departmentData.id}
        defaultDepartmentName={departmentData.name}
      />

      {/* Content Detail Modal */}
      {showContentModal && selectedContent && (
        <ContentModal
          contentId={selectedContent.id}
          isOpen={showContentModal}
          onClose={() => {
            setShowContentModal(false);
            setSelectedContent(null);
          }}
        />
      )}
    </div>
  );
};

export default DepartmentDetailPage;