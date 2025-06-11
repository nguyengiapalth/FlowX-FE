import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { useProfileStore } from '../stores/profile-store';
import { useDepartmentStore } from '../stores/department-store';
import { useProjectStore } from '../stores/project-store';
import { useContentStore } from '../stores/content-store';
import { useTaskStore } from '../stores/task-store';
import { ExpandableCreateForm } from '../index.ts';
import SimpleToast from '../components/utils/SimpleToast';
import type { ContentCreateRequest } from '../types/content';
import type { FileCreateRequest } from '../types/file';
import { formatTimeAgo, getPriorityColor, getPriorityText, getStatusText } from '../utils/format.util';
import fileService from '../services/file.service';
import { 
  CreditCard, 
  Users, 
  LayoutGrid, 
  Plus, 
  CalendarCheck, 
  FolderOpen,
  ClipboardList
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isManager, isGlobalManager, userRoles } = useAuthStore();
  const { user } = useProfileStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { myProjects, fetchMyProjects } = useProjectStore();
  const { createContent, syncContentFiles, contents, fetchAllContents } = useContentStore();
  const { myAssignedTasks, fetchMyAssignedTasks } = useTaskStore();
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Fetch all necessary data when component mounts
    fetchMyProjects();
    fetchAllContents();
    fetchMyAssignedTasks();
    if (isGlobalManager()) {
      fetchDepartments();
    }
  }, [fetchMyProjects, fetchAllContents, fetchMyAssignedTasks, fetchDepartments, isGlobalManager]);

  const handleCreateContent = async (request: ContentCreateRequest, files?: File[]) => {
    try {
      // First, create the content
      const createdContent = await createContent({
        ...request,
        contentTargetType: 'GLOBAL',
        targetId: 0,
        parentId: -1
      });

      console.log('Content created successfully:', createdContent);

      // If there are files, upload them
      if (files && files.length > 0 && createdContent.id) {
        await uploadContentFiles(createdContent.id, files);
        // Sync the content to update hasFile flag
        await syncContentFiles(createdContent.id);
      }
      
      setToast({ 
        message: 'Đã chia sẻ cập nhật thành công!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Failed to create content:', error);
      setToast({ 
        message: error.message || 'Không thể chia sẻ cập nhật. Vui lòng thử lại.', 
        type: 'error' 
      });
      throw error;
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

  // Quick action handlers
  const handleCreateProject = () => {
    navigate('/projects');
  };

  const handleCreateTask = () => {
    navigate('/tasks');
  };

  const handleInviteMember = () => {
    navigate('/users');
  };

  const handleViewAllProjects = () => {
    navigate('/projects');
  };

  const handleViewAllActivities = () => {
    navigate('/newsfeed');
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/project/${projectId}`);
  };

  const recentProjects = myProjects.slice(0, 3).map((project: any) => ({
    id: project.id,
    name: project.name,
    progress: project.progress || 0,
    status: getStatusText(project.status),
    dueDate: project.endDate ? new Date(project.endDate).toLocaleDateString('vi-VN') : 'Chưa xác định',
    members: 0, // We don't have member count in the current Project interface
    priority: project.priority || 'MEDIUM'
  }));

  // Use real data for recent activities (from contents)
  const recentActivities = contents.slice(0, 4).map(content => ({
    id: content.id,
    user: content.author.fullName,
    action: 'đã chia sẻ cập nhật',
    target: `"${content.subtitle || content.body.substring(0, 30)}..."`,
    time: formatTimeAgo(content.createdAt),
    avatar: content.author.avatar || '👤'
  }));

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Chào mừng trở lại! Đây là tổng quan về các dự án và nhiệm vụ của bạn.
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                isManager() ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isManager() ? '👑 Manager' : '👤 Staff'}
              </span>
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            {/* Other quick actions can be added here */}
          </div>
        </div>

        {/* Quick Share Update */}
        <div className="mb-8">
          <ExpandableCreateForm
            contentTargetType="GLOBAL"
            targetId={0}
            parentId={-1}
            onSubmit={handleCreateContent}
            placeholder="Chia sẻ cập nhật về tiến độ công việc hoặc thông báo quan trọng..."
            compactPlaceholder="Chia sẻ cập nhật nhanh..."
            autoFocus={false}
          />
        </div>

        {/* User Role and Data Display */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Roles */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quyền hạn của bạn</h3>
            {userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((userRole) => (
                  <div key={userRole.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{userRole.role.name}</span>
                      <p className="text-sm text-gray-500">Phạm vi: {userRole.scope}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      userRole.scope === 'GLOBAL' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userRole.scope}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Đang tải thông tin quyền hạn...</p>
            )}
          </div>

          {/* Conditional Data Display */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isGlobalManager() ? 'Tất cả phòng ban' : (user?.department ? `Phòng ban: ${user.department.name}` : 'Thông tin của tôi')}
            </h3>
            
            {isGlobalManager() ? (
              departments.length > 0 ? (
                <div className="space-y-2">
                  {departments.slice(0, 5).map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{dept.name || `Phòng ban ${index + 1}`}</span>
                    </div>
                  ))}
                  {departments.length > 5 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      và {departments.length - 5} phòng ban khác...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Đang tải danh sách phòng ban...</p>
              )
            ) : (
              <div className="space-y-4">
                {/* Hiển thị thông tin phòng ban */}
                {user?.department && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Phòng ban của tôi</span>
                    </div>
                    <p className="text-blue-800 font-semibold">{user.department.name}</p>
                  </div>
                )}

                {/* Hiển thị danh sách dự án */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dự án tham gia</h4>
                  {myProjects.length > 0 ? (
                    <div className="space-y-2">
                      {myProjects.slice(0, 4).map((project, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{project.name || `Dự án ${index + 1}`}</span>
                          <span className="text-sm text-gray-500">{getStatusText(project.status) || 'Đang tiến hành'}</span>
                        </div>
                      ))}
                      {myProjects.length > 4 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          và {myProjects.length - 4} dự án khác...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-2">Chưa tham gia dự án nào</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Dự án gần đây</h2>
                <button 
                  onClick={handleViewAllProjects}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                >
                  Xem tất cả
                </button>
              </div>
              
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectClick(project.id)}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                          {getPriorityText(project.priority)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">{project.status}</span>
                        <span className="text-sm text-gray-500">Hạn: {project.dueDate}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">Tiến độ</span>
                            <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {project.members}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Chưa có dự án nào</p>
                  <p className="mb-4">Bắt đầu bằng cách tạo dự án đầu tiên của bạn</p>
                  <button 
                    onClick={handleCreateProject}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Tạo dự án mới
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Hoạt động gần đây</h2>
                <button 
                  onClick={handleViewAllActivities}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                >
                  Xem tất cả
                </button>
              </div>
              
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {activity.avatar.startsWith('http') ? (
                          <img src={activity.avatar} alt={activity.user} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          activity.avatar
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-gray-600">{activity.action}</span>{' '}
                          <span className="font-medium text-primary-600">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Chưa có hoạt động nào</p>
                  <p>Hoạt động của team sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
              <div className="space-y-3">
                <button 
                  onClick={handleCreateProject}
                  className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tạo dự án mới
                </button>
                <button 
                  onClick={handleCreateTask}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  Thêm nhiệm vụ
                </button>
                <button 
                  onClick={handleInviteMember}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Mời thành viên
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Projects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tổng dự án</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            {isManager() ? (
              myProjects.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gray-900">{myProjects.length}</span>
                    <span className="text-sm text-green-600 font-medium">
                      {myProjects.filter(p => getStatusText(p.status) === 'Hoàn thành').length} hoàn thành
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tiến độ trung bình</span>
                      <span className="font-medium">
                        {Math.round(myProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / myProjects.length)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.round(myProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / myProjects.length)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="text-3xl font-bold text-gray-900">0</span>
                  <p className="text-sm text-gray-500 mt-1">Chưa có dự án nào</p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* Hiển thị thông tin phòng ban */}
                {user?.department && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Phòng ban của tôi</span>
                    </div>
                    <p className="text-blue-800 font-semibold">{user.department.name}</p>
                  </div>
                )}

                {/* Hiển thị danh sách dự án */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dự án tham gia</h4>
                  {myProjects.length > 0 ? (
                    <div className="space-y-2">
                      {myProjects.slice(0, 4).map((project, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{project.name || `Dự án ${index + 1}`}</span>
                          <span className="text-sm text-gray-500">{getStatusText(project.status) || 'Đang tiến hành'}</span>
                        </div>
                      ))}
                      {myProjects.length > 4 && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          và {myProjects.length - 4} dự án khác...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm py-2">Chưa tham gia dự án nào</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}; 