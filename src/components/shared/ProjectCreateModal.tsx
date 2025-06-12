import React, { useState, useEffect } from 'react';
import { X, Building, Loader2, Crown, User } from 'lucide-react';
import { useProfileStore } from '../../stores/profile-store';
import { useAuthStore } from '../../stores/auth-store';
import projectService from '../../services/project.service';
import projectMemberService from '../../services/project-member.service';
import departmentService from '../../services/department.service';
import userService from '../../services/user.service';
import type { ProjectCreateRequest } from '../../types/project';
import type { DepartmentResponse } from '../../types/department';
import type { UserResponse } from '../../types/user';
import type { ProjectStatus, PriorityLevel, RoleDefault } from '../../types/enums';

interface MemberWithRole {
  userId: number;
  role: RoleDefault;
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  departmentId: number;
  status: ProjectStatus;
  priority: PriorityLevel;
  membersWithRoles: MemberWithRole[];
}

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  defaultDepartmentId?: number; // For department-specific creation
  defaultDepartmentName?: string;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  defaultDepartmentId,
  defaultDepartmentName
}) => {
  const { user } = useProfileStore();
  const { isGlobalManager, isDepartmentManager } = useAuthStore();

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    departmentId: defaultDepartmentId || 0,
    status: 'NOT_STARTED' as ProjectStatus,
    priority: 'MEDIUM' as PriorityLevel,
    membersWithRoles: []
  });

  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      // Reset form when modal opens
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        departmentId: defaultDepartmentId || 0,
        status: 'NOT_STARTED' as ProjectStatus,
        priority: 'MEDIUM' as PriorityLevel,
        membersWithRoles: []
      });
    }
  }, [isOpen, defaultDepartmentId]);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      
      const promises: Promise<any>[] = [userService.getAllUsers()];
      
      // Only load departments if user is global manager
      if (isGlobalManager()) {
        promises.push(departmentService.getAllDepartments());
      }

      const responses = await Promise.all(promises);
      const [usersResponse, departmentsResponse] = responses;

      if (usersResponse.code === 200 && usersResponse.data) {
        setUsers(usersResponse.data);
      }

      if (isGlobalManager() && departmentsResponse?.code === 200 && departmentsResponse.data) {
        setDepartments(departmentsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      onError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      onError('Vui lòng nhập tên dự án');
      return;
    }
    if (!formData.departmentId) {
      onError('Vui lòng chọn phòng ban');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create project request
      const request: ProjectCreateRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        departmentId: formData.departmentId,
        createdById: user?.id || 0,
        status: formData.status,
        priority: formData.priority,
        memberIds: formData.membersWithRoles.map(m => m.userId)
      };

      const response = await projectService.createProject(request);
      
      if (response.code === 200 || response.code === 201) {
        const createdProject = response.data;
        
        // Add members to the project with their assigned roles
        if (formData.membersWithRoles.length > 0 && createdProject) {
          try {
            const addMemberPromises = formData.membersWithRoles.map(member =>
              projectMemberService.createProjectMember({
                projectId: createdProject.id,
                userId: member.userId,
                role: member.role,
                status: 'ACTIVE'
              })
            );

            await Promise.all(addMemberPromises);
            
            const roleCount = formData.membersWithRoles.reduce((acc, member) => {
              acc[member.role] = (acc[member.role] || 0) + 1;
              return acc;
            }, {} as Record<RoleDefault, number>);
            
            const roleText = Object.entries(roleCount)
              .map(([role, count]) => `${count} ${getRoleText(role as RoleDefault)}`)
              .join(', ');
            
            onSuccess(`Tạo dự án thành công và đã thêm ${formData.membersWithRoles.length} thành viên (${roleText})!`);
          } catch (memberError) {
            console.error('Failed to add members:', memberError);
            onSuccess('Tạo dự án thành công nhưng có lỗi khi thêm thành viên. Bạn có thể thêm thành viên sau.');
          }
        } else {
          onSuccess('Tạo dự án thành công!');
        }
        
        onClose();
      } else {
        onError(response.message || 'Có lỗi xảy ra khi tạo dự án');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      onError('Không thể tạo dự án. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMemberToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      membersWithRoles: prev.membersWithRoles.some(m => m.userId === userId)
        ? prev.membersWithRoles.filter(m => m.userId !== userId)
        : [...prev.membersWithRoles, { userId, role: 'MEMBER' }]
    }));
  };

  const handleRoleChange = (userId: number, role: RoleDefault) => {
    setFormData(prev => ({
      ...prev,
      membersWithRoles: prev.membersWithRoles.map(member =>
        member.userId === userId ? { ...member, role } : member
      )
    }));
  };

  const getRoleText = (role: RoleDefault) => {
    const roleMap: Record<RoleDefault, string> = {
      'MANAGER': 'Quản lý',
      'MEMBER': 'Thành viên',
      'HR': 'Nhân sự',
      'USER': 'Người dùng'
    };
    return roleMap[role] || role;
  };

  const getRoleIcon = (role: RoleDefault) => {
    return role === 'MANAGER' ? Crown : User;
  };

  const getRoleColor = (role: RoleDefault) => {
    const colorMap: Record<RoleDefault, string> = {
      'MANAGER': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'MEMBER': 'text-blue-600 bg-blue-50 border-blue-200',
      'HR': 'text-green-600 bg-green-50 border-green-200',
      'USER': 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colorMap[role] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (!isOpen) return null;

  const selectedMember = (userId: number) => 
    formData.membersWithRoles.find(m => m.userId === userId);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-0 max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Tạo dự án mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Department Info (if default department is provided) */}
          {defaultDepartmentName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Tạo dự án cho phòng ban: <span className="font-semibold">{defaultDepartmentName}</span>
                </span>
              </div>
            </div>
          )}

          {/* Project Name */}
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
              disabled={isSubmitting}
            />
          </div>

          {/* Project Description */}
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
              disabled={isSubmitting}
            />
          </div>

          {/* Department Selection (only for global managers when no default department) */}
          {isGlobalManager() && !defaultDepartmentId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phòng ban <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting || isLoadingData}
              >
                <option value={0}>Chọn phòng ban</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                min={formData.startDate || undefined}
              />
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
                <option value="URGENT">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Members Selection with Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thành viên ban đầu <span className="text-xs text-gray-500">(chọn thành viên và vai trò của họ)</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
              {isLoadingData ? (
                <p className="text-sm text-gray-500">Đang tải danh sách người dùng...</p>
              ) : users.length > 0 ? (
                <div className="space-y-3">
                  {users.map(userItem => {
                    const member = selectedMember(userItem.id);
                    const isSelected = !!member;
                    const RoleIcon = member ? getRoleIcon(member.role) : User;
                    
                    return (
                      <div key={userItem.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleMemberToggle(userItem.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {userItem.fullName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{userItem.fullName}</p>
                              <p className="text-xs text-gray-500">{userItem.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center space-x-3">
                            {/* Role Badge */}
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getRoleColor(member.role)}`}>
                              <RoleIcon className="w-3 h-3" />
                              <span>{getRoleText(member.role)}</span>
                            </div>
                            
                            {/* Role Selector */}
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(userItem.id, e.target.value as RoleDefault)}
                              className="text-xs border border-gray-300 rounded px-3 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white min-w-[100px]"
                              disabled={isSubmitting}
                            >
                              <option value="MEMBER">👤 Thành viên</option>
                              <option value="MANAGER">👑 Quản lý</option>
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Không có người dùng nào</p>
              )}
            </div>
            
            {/* Summary */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Đã chọn {formData.membersWithRoles.length} thành viên</span>
              {formData.membersWithRoles.length > 0 && (
                <div className="flex items-center space-x-2">
                  {Object.entries(
                    formData.membersWithRoles.reduce((acc, member) => {
                      acc[member.role] = (acc[member.role] || 0) + 1;
                      return acc;
                    }, {} as Record<RoleDefault, number>)
                  ).map(([role, count]) => (
                    <span key={role} className={`px-2 py-1 rounded-md ${getRoleColor(role as RoleDefault)}`}>
                      {count} {getRoleText(role as RoleDefault)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.departmentId}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                Đang tạo...
              </div>
            ) : (
              'Tạo dự án'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 