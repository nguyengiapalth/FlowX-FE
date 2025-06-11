import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { 
  LayoutDashboard, 
  ChevronRight, 
  Edit, 
  Plus, 
  UserPlus, 
  X, 
  Building, 
  Loader2, 
  Check, 
  Users 
} from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import { useContentStore } from '../stores/content-store';
import DiscussionSection from '../components/content/DiscussionSection.tsx';
import TaskSection from '../components/tasks/TaskSection.tsx';
import { ExpandableCreateForm } from '../index.ts';
import SimpleToast from '../components/utils/SimpleToast';
import { BackgroundModal } from '../components/shared/BackgroundModal';
import projectService from '../services/project.service';
import projectMemberService from '../services/project-member.service';
import userService from '../services/user.service';
import contentService from "../services/content.service.ts";
import type { ProjectResponse, ProjectMemberResponse } from '../types/project';
import type { UserResponse } from '../types/user';
import type { ContentCreateRequest } from '../types/content';
import type { FileCreateRequest } from '../types/file';
import fileService from '../services/file.service';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useProfileStore();
  const { isManager } = useAuthStore();
  const { createContent, syncContentFiles } = useContentStore();
  const [activeTab, setActiveTab] = useState<'members' | 'tasks' | 'discussion' | 'about'>('members');

  // States for real data
  const [projectData, setProjectData] = useState<ProjectResponse | null>(null);
  const [members, setMembers] = useState<ProjectMemberResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Background update states
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);

  // Edit mode states for about section
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING' as any,
    priority: 'MEDIUM' as any
  });

  // Add member modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('MEMBER');

  const projectIdNum = parseInt(projectId || '1');

  // Handle view profile
  const handleViewProfile = (userId: number) => {
    if (userId === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/user/${userId}`);
    }
  };

  // Handle create project content
  const handleCreateProjectContent = async (request: ContentCreateRequest, files?: File[]) => {
    try {
      // First, create the content
      const createdContent = await createContent({
        ...request,
        contentTargetType: 'PROJECT',
        targetId: projectIdNum,
        parentId: -1
      });

      // If there are files, upload them
      if (files && files.length > 0 && createdContent.id) {
        await uploadContentFiles(createdContent.id, files);
        
        // Sync the content to update hasFile flag
        await syncContentFiles(createdContent.id);
      }
      
      setToast({ 
        message: 'Đã chia sẻ cập nhật dự án thành công!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Failed to create project content:', error);
      setToast({ 
        message: error.message || 'Không thể chia sẻ cập nhật. Vui lòng thử lại.', 
        type: 'error' 
      });
      throw error;
    }
  };

  // Background handlers
  const handleBackgroundUpdate = async (objectKey: string) => {
    if (!projectData) return;
    
    await projectService.updateProjectBackground(projectData.id, objectKey);
    
    // Refresh project data
    const updatedProject = await projectService.getProjectById(projectData.id);
    if (updatedProject.data) {
      setProjectData(updatedProject.data);
    }
  };

  const handleToastSuccess = (message: string) => {
    setToast({ message, type: 'success' });
  };

  const handleToastError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  // Handle edit mode
  const startEditInfo = () => {
    if (!projectData) return;
    setEditFormData({
      name: projectData.name,
      description: projectData.description || '',
      startDate: projectData.startDate || '',
      endDate: projectData.endDate || '',
      status: projectData.status,
      priority: projectData.priority
    });
    setIsEditingInfo(true);
  };

  const cancelEditInfo = () => {
    setIsEditingInfo(false);
    setEditFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'PLANNING' as any,
      priority: 'MEDIUM' as any
    });
  };

  const saveEditInfo = async () => {
    if (!projectData) return;
    if (!editFormData.name.trim()) {
      setToast({ message: 'Vui lòng nhập tên dự án', type: 'error' });
      return;
    }

    try {
      const response = await projectService.updateProject(projectData.id, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        startDate: editFormData.startDate || undefined,
        endDate: editFormData.endDate || undefined,
        status: editFormData.status,
        priority: editFormData.priority
      });

      if (response.code === 200 && response.data) {
        setProjectData(response.data);
        setIsEditingInfo(false);
        setToast({ message: 'Cập nhật thông tin dự án thành công!', type: 'success' });
      } else {
        setToast({ message: response.message || 'Có lỗi xảy ra khi cập nhật', type: 'error' });
      }
    } catch (error: any) {
      console.error('Failed to update project info:', error);
      setToast({ message: 'Không thể cập nhật thông tin dự án', type: 'error' });
    }
  };

  // Handle add member modal
  const handleOpenAddMemberModal = async () => {
    try {
      // Get all users
      const usersResponse = await userService.getAllUsers();
      if (usersResponse.code === 200 && usersResponse.data) {
        // Filter out users who are already members
        const existingMemberIds = members.map(member => member.user?.id).filter(Boolean);
        const filteredUsers = usersResponse.data.filter(user => !existingMemberIds.includes(user.id));
        setAvailableUsers(filteredUsers);
      }
      setShowAddMemberModal(true);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setToast({ message: 'Không thể tải danh sách người dùng', type: 'error' });
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      setToast({ message: 'Vui lòng chọn ít nhất một thành viên', type: 'error' });
      return;
    }

    setIsAddingMember(true);
    try {
      // Add each selected user as a project member
      const addPromises = selectedUsers.map(userId => 
        projectMemberService.createProjectMember({
          projectId: projectIdNum,
          userId: userId,
          role: selectedRole as any,
          status: 'ACTIVE'
        })
      );

      await Promise.all(addPromises);

      // Refresh members list
      const membersResponse = await projectMemberService.getMembersByProjectId(projectIdNum);
      if (membersResponse.code === 200 && membersResponse.data) {
        setMembers(membersResponse.data);
      }

      // Reset form and close modal
      setSelectedUsers([]);
      setSelectedRole('MEMBER');
      setShowAddMemberModal(false);
      
      setToast({ message: 'Thêm thành viên thành công!', type: 'success' });
    } catch (error: any) {
      console.error('Failed to add members:', error);
      setToast({ message: error.message || 'Không thể thêm thành viên. Vui lòng thử lại.', type: 'error' });
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCloseAddMemberModal = () => {
    setShowAddMemberModal(false);
    setSelectedUsers([]);
    setSelectedRole('MEMBER');
    setAvailableUsers([]);
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
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

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      if (!projectIdNum) return;
      
      try {
        setIsLoading(true);
        setError(null);

        // Load project info and members in parallel
        const [projectResponse, membersResponse] = await Promise.all([
          projectService.getProjectById(projectIdNum),
          projectMemberService.getMembersByProjectId(projectIdNum)
        ]);

        if (projectResponse.data) setProjectData(projectResponse.data);
        if (membersResponse.data) setMembers(membersResponse.data);

      } catch (error) {
        console.error('Failed to load project data:', error);
        setError('Không thể tải dữ liệu dự án');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectIdNum]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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

  if (error || !projectData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl text-gray-400 mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không thể tải thông tin dự án</h1>
          <p className="text-gray-600 mb-4">{error || 'Dự án không tồn tại hoặc bạn không có quyền truy cập'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Quay lại danh sách dự án
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
            <Link to="/projects" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dự án
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <ChevronRight className="w-6 h-6 text-gray-400" />
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{projectData.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Project Cover */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
        <div 
          className={`relative h-64 ${!projectData.background ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}`}
          style={{
            backgroundImage: projectData.background ? `url(${projectData.background})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >

          {/* Background Edit Button - only shown if user is manager */}
          {isManager() && (
            <button 
              onClick={() => setShowBackgroundModal(true)}
              className="absolute top-4 right-4 bg-white text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-lg flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={projectData.background ? "Thay đổi ảnh bìa" : "Thêm ảnh bìa"}
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-medium">{projectData.background ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}</span>
            </button>
          )}
          
          {/* Project Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{projectData.name}</h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span>👥 {members.length} thành viên</span>
                  <span>📅 {projectData.startDate && formatDate(projectData.startDate)} - {projectData.endDate && formatDate(projectData.endDate)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  projectData.status === 'IN_PROGRESS' ? 'bg-green-500 text-white' : 
                  projectData.status === 'COMPLETED' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {projectData.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 
                   projectData.status === 'COMPLETED' ? 'Hoàn thành' :
                   projectData.status}
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
              { key: 'tasks', label: 'Nhiệm vụ', icon: '📋' },
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Thành viên dự án</h2>
              
              {/* Add Member Button - only show if user can manage project */}
              {isManager() && (
                <button
                  onClick={handleOpenAddMemberModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm thành viên</span>
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-500 mb-4">Chưa có thành viên nào trong dự án này</p>
                
                {/* Add Member Button for empty state */}
                {isManager() && (
                  <button
                    onClick={handleOpenAddMemberModal}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Thêm thành viên đầu tiên</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div key={member.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={member.user?.avatar || '/default-avatar.png'}
                          alt={member.user?.fullName || 'User'}
                          className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                          onClick={() => member.user?.id && handleViewProfile(member.user.id)}
                          title="Click để xem profile"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => member.user?.id && handleViewProfile(member.user.id)}
                          title="Click để xem profile"
                        >
                          {member.user?.fullName || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">{member.role || 'Thành viên'}</p>
                        {member.joinDate && (
                          <p className="text-xs text-gray-400">
                            Tham gia: {formatDate(member.joinDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                      
                      <button
                        onClick={() => member.user?.id && handleViewProfile(member.user.id)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
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

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <TaskSection
            targetType="PROJECT"
            targetId={projectIdNum}
            title="Nhiệm vụ dự án"
          />
        )}

        {/* Discussion Tab */}
        {activeTab === 'discussion' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Thảo luận dự án</h2>
            <div className="mb-6">
              <ExpandableCreateForm
                contentTargetType="PROJECT"
                targetId={projectIdNum}
                parentId={-1}
                onSubmit={handleCreateProjectContent}
                placeholder={`Chia sẻ cập nhật tiến độ hoặc thảo luận về dự án ${projectData.name}...`}
                compactPlaceholder={`Chia sẻ với team ${projectData.name}...`}
                autoFocus={false}
              />
            </div>
            <DiscussionSection
              targetType="PROJECT"
              targetId={projectIdNum}
              title=""
              placeholder={`Chia sẻ với team ${projectData.name}...`}
            />
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin dự án</h2>
              
              {/* Edit button - only show if user can manage project */}
              {isManager() && !isEditingInfo && (
                <button
                  onClick={startEditInfo}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                                      <Edit className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tên dự án</h3>
                {isEditingInfo ? (
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên dự án"
                  />
                ) : (
                  <p className="text-gray-600">{projectData.name}</p>
                )}
              </div>
              
              {/* Project Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mô tả</h3>
                {isEditingInfo ? (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mô tả dự án"
                  />
                ) : (
                  <p className="text-gray-600">{projectData.description || 'Chưa có mô tả'}</p>
                )}
              </div>

              {/* Project Dates */}
              {isEditingInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ngày bắt đầu</h3>
                    <input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ngày kết thúc</h3>
                    <input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Project Status and Priority */}
              {isEditingInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Trạng thái</h3>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PLANNING">Lên kế hoạch</option>
                      <option value="IN_PROGRESS">Đang thực hiện</option>
                      <option value="ON_HOLD">Tạm dừng</option>
                      <option value="COMPLETED">Hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Mức độ ưu tiên</h3>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HIGH">Cao</option>
                      <option value="CRITICAL">Khẩn cấp</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Edit mode buttons */}
              {isEditingInfo && (
                <div className="flex space-x-3">
                  <button
                    onClick={saveEditInfo}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Lưu thay đổi
                  </button>
                  <button
                    onClick={cancelEditInfo}
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
                      <span className="text-gray-600">Ngày tạo:</span>
                      <span className="font-medium">{formatDate(projectData.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Thời gian</h3>
                  <div className="space-y-2 text-sm">
                    {projectData.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngày bắt đầu:</span>
                        <span className="font-medium">{formatDate(projectData.startDate)}</span>
                      </div>
                    )}
                    {projectData.endDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ngày kết thúc:</span>
                        <span className="font-medium">{formatDate(projectData.endDate)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cập nhật:</span>
                      <span className="font-medium">{formatDate(projectData.updatedAt)}</span>
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
        title={projectData.background ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}
        targetType="PROJECT"
        targetId={projectData.id}
        targetName={projectData.name}
        onBackgroundUpdate={handleBackgroundUpdate}
      />

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-0 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Thêm thành viên vào dự án</h3>
              <button
                onClick={handleCloseAddMemberModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isAddingMember}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Project Info */}
              {projectData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                                      <Building className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Thêm thành viên cho dự án: <span className="font-semibold">{projectData.name}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò trong dự án
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isAddingMember}
                >
                  <option value="MEMBER">Thành viên</option>
                  <option value="LEADER">Trưởng nhóm</option>
                  <option value="MANAGER">Quản lý</option>
                </select>
              </div>

              {/* User List */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Chọn người dùng ({selectedUsers.length} đã chọn)
                </label>
                
                {availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Tất cả người dùng đã là thành viên của dự án</p>
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer ${
                          selectedUsers.includes(user.id) ? 'bg-green-50 border-green-200' : ''
                        }`}
                        onClick={() => !isAddingMember && handleUserToggle(user.id)}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                              disabled={isAddingMember}
                            />
                          </div>
                          <img
                            src={user.avatar || '/default-avatar.png'}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.department && (
                              <div className="text-xs text-gray-400">{user.department.name}</div>
                            )}
                          </div>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Users Summary */}
              {selectedUsers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Sẽ thêm {selectedUsers.length} thành viên với vai trò: {
                        selectedRole === 'MEMBER' ? 'Thành viên' :
                        selectedRole === 'LEADER' ? 'Trưởng nhóm' : 'Quản lý'
                      }
                    </span>
                  </div>
                  <div className="text-sm text-green-700">
                    {availableUsers
                      .filter(user => selectedUsers.includes(user.id))
                      .map(user => user.fullName)
                      .join(', ')
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex space-x-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleCloseAddMemberModal}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={isAddingMember}
              >
                Hủy
              </button>
              <button
                onClick={handleAddMembers}
                disabled={isAddingMember || selectedUsers.length === 0}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
              >
                {isAddingMember ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Đang thêm...
                  </div>
                ) : (
                  `Thêm ${selectedUsers.length} thành viên`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
