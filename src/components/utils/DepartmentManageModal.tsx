import React, { useState, useEffect } from 'react';
import departmentService from '../../services/department.service';
import userService from '../../services/user.service';
import { ImageCropper } from './ImageCropper';
import { useContentStore } from '../../stores/content-store';
import fileService from '../../services/file.service';
import type { DepartmentResponse, DepartmentUpdateRequest } from '../../types/department';
import type { UserResponse } from '../../types/user';
import type { ContentCreateRequest } from '../../types/content';
import type { FileCreateRequest } from '../../types/file';

interface DepartmentManageModalProps {
  department: DepartmentResponse;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDepartmentUpdated: (updatedDepartment: DepartmentResponse) => void;
}

type ModalType = 'info' | 'manager' | 'background';

const DepartmentManageModal: React.FC<DepartmentManageModalProps> = ({
  department,
  isOpen,
  onClose,
  onSuccess,
  onError,
  onDepartmentUpdated
}) => {
  const { createContent } = useContentStore();
  const [activeModal, setActiveModal] = useState<ModalType>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Info update states
  const [formData, setFormData] = useState<DepartmentUpdateRequest>({
    name: department.name,
    description: department.description || ''
  });

  // Manager update states
  const [availableUsers, setAvailableUsers] = useState<UserResponse[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Background update states
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [cropperImageFile, setCropperImageFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string>('');

  // Upload helper method
  const uploadContentFiles = async (contentId: number, files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      try {
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

        const response = await fetch(presignedResponse.data.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        return presignedResponse.data;
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: department.name,
        description: department.description || ''
      });
      setSelectedManagerId(null);
      setBackgroundFile(null);
      setBackgroundPreview('');
      
      if (activeModal === 'manager') {
        loadUsers();
      }
    }
  }, [isOpen, department, activeModal]);

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.code === 200 && response.data) {
        // Filter users who can be managers (exclude current department members to avoid conflicts)
        const eligibleUsers = response.data.filter(user => 
          user.department?.id !== department.id || !user.department
        );
        setAvailableUsers(eligibleUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      onError('Không thể tải danh sách người dùng');
    }
  };

  const handleUpdateInfo = async () => {
    if (!formData.name?.trim()) {
      onError('Vui lòng nhập tên phòng ban');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await departmentService.updateDepartment(department.id, {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined
      });

      if (response.code === 200 && response.data) {
        onDepartmentUpdated(response.data);
        onSuccess('Cập nhật thông tin phòng ban thành công!');
        onClose();
      } else {
        onError(response.message || 'Có lỗi xảy ra khi cập nhật thông tin');
      }
    } catch (error: any) {
      console.error('Failed to update department info:', error);
      onError(error.response?.data?.message || 'Không thể cập nhật thông tin phòng ban');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateManager = async () => {
    if (!selectedManagerId) {
      onError('Vui lòng chọn manager mới');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await departmentService.updateDepartmentManager(department.id, selectedManagerId);

      if (response.code === 200 && response.data) {
        onDepartmentUpdated(response.data);
        onSuccess('Cập nhật manager phòng ban thành công!');
        onClose();
      } else {
        onError(response.message || 'Có lỗi xảy ra khi cập nhật manager');
      }
    } catch (error: any) {
      console.error('Failed to update department manager:', error);
      onError(error.response?.data?.message || 'Không thể cập nhật manager phòng ban');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBackground = async () => {
    if (!backgroundFile) {
      onError('Vui lòng chọn ảnh nền');
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create content with special subtitle that triggers background update event
      const postRequest: ContentCreateRequest = {
        subtitle: `đã thay đổi ảnh bìa của ${department.name}`,
        body: '', // No description needed
        contentTargetType: 'DEPARTMENT',
        targetId: department.id,
        parentId: -1
      };

      let createdContent = await createContent(postRequest);

      // Step 2: Upload file - this will trigger the background update event automatically
      if (createdContent.id) {
        await uploadContentFiles(createdContent.id, [backgroundFile]);
        // Backend will automatically sync background through BackgroundUpdatedEvent
      }

      // Step 3: Wait a moment for backend processing then refresh
      setTimeout(async () => {
        // Refresh department data by calling callback
        const refreshedResponse = await departmentService.getDepartmentById(department.id);
        if (refreshedResponse.code === 200 && refreshedResponse.data) {
          onDepartmentUpdated(refreshedResponse.data);
        }
      }, 200);

      onSuccess('Cập nhật ảnh nền phòng ban thành công!');
      onClose();
    } catch (error: any) {
      console.error('Failed to update department background:', error);
      onError('Không thể cập nhật ảnh nền phòng ban');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onError('Vui lòng chọn file ảnh hợp lệ!');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB!');
        return;
      }

      setCropperImageFile(file);
      setShowImageCropper(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    setBackgroundFile(croppedFile);
    setBackgroundPreview(URL.createObjectURL(croppedFile));
    setShowImageCropper(false);
    setCropperImageFile(null);
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setCropperImageFile(null);
  };

  const filteredUsers = availableUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Quản lý phòng ban: {department.name}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4">
              <button
                onClick={() => setActiveModal('info')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === 'info'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Thông tin cơ bản
              </button>
              <button
                onClick={() => setActiveModal('manager')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === 'manager'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Quản lý Manager
              </button>
              <button
                onClick={() => setActiveModal('background')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeModal === 'background'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Ảnh nền
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Info Tab */}
            {activeModal === 'info' && (
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
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập mô tả phòng ban"
                  />
                </div>
              </div>
            )}

            {/* Manager Tab */}
            {activeModal === 'manager' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm người dùng
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tìm theo email hoặc tên..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn Manager mới
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedManagerId === user.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedManagerId(user.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName || user.email}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                          {selectedManagerId === user.id && (
                            <div className="flex-shrink-0">
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Không tìm thấy người dùng nào
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Background Tab */}
            {activeModal === 'background' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh nền hiện tại
                  </label>
                  <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                    {department.background ? (
                      <img
                        src={department.background}
                        alt="Department background"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Chưa có ảnh nền
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh nền mới
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {backgroundPreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xem trước
                    </label>
                    <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={backgroundPreview}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (activeModal === 'info') handleUpdateInfo();
                  else if (activeModal === 'manager') handleUpdateManager();
                  else if (activeModal === 'background') handleUpdateBackground();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && cropperImageFile && (
        <ImageCropper
          imageFile={cropperImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
          cropType="background"
        />
      )}
    </>
  );
};

export default DepartmentManageModal; 