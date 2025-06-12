import React, { useState } from 'react';
import { ImageCropper } from '../utils/ImageCropper';
import { useContentStore } from '../../stores/content-store';
import { X, Plus, Upload } from 'lucide-react';
import { useProfileStore } from '../../stores/profile-store';
import userService from '../../services/user.service';
import fileService from '../../services/file.service';
import contentService from '../../services/content.service';
import type { ContentCreateRequest } from '../../types/content';
import type { FileCreateRequest } from '../../types/file';

interface AvatarBackgroundModalsProps {
  showAvatarModal: boolean;
  showBackgroundModal: boolean;
  onCloseAvatarModal: () => void;
  onCloseBackgroundModal: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const AvatarBackgroundModals: React.FC<AvatarBackgroundModalsProps> = ({
  showAvatarModal,
  showBackgroundModal,
  onCloseAvatarModal,
  onCloseBackgroundModal,
  onSuccess,
  onError
}) => {
  const { user, fetchProfile } = useProfileStore();
  const { createContent, syncContentFiles } = useContentStore();

  // States
  const [avatar, setAvatar] = useState<string>('');
  const [background, setBackground] = useState<string>('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isUpdatingBackground, setIsUpdatingBackground] = useState(false);
  const [avatarPostBody, setAvatarPostBody] = useState<string>('');
  const [backgroundPostBody, setBackgroundPostBody] = useState<string>('');
  
  // Cropper states for integrated cropping
  const [avatarCropperFile, setAvatarCropperFile] = useState<File | null>(null);
  const [backgroundCropperFile, setBackgroundCropperFile] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setAvatarCropperFile(file);
    }
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setBackgroundCropperFile(file);
    }
  };

  const handleAvatarCropComplete = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    console.log('Avatar crop completed:', { url, fileSize: croppedFile.size });
    
    setAvatar(url);
    setAvatarFile(croppedFile);
    setAvatarPostBody('');
    setAvatarCropperFile(null);
  };

  const handleBackgroundCropComplete = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    console.log('Background crop completed:', { url, fileSize: croppedFile.size });
    
    setBackground(url);
    setBackgroundFile(croppedFile);
    setBackgroundPostBody('');
    setBackgroundCropperFile(null);
  };

  const handleAvatarCropCancel = () => {
    setAvatarCropperFile(null);
  };

  const handleBackgroundCropCancel = () => {
    setBackgroundCropperFile(null);
  };

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

  const handleUpdateAvatar = async () => {
    if (!user || !avatarFile) return;

    setIsUpdatingAvatar(true);
    try {
      const postRequest: ContentCreateRequest = {
        subtitle: 'đã cập nhật ảnh đại diện',
        body: avatarPostBody.trim(),
        contentTargetType: 'GLOBAL',
        targetId: 0,
        parentId: -1
      };

      let createdContent = await createContent(postRequest);

      if (createdContent.id) {
        await uploadContentFiles(createdContent.id, [avatarFile]);
        await syncContentFiles(createdContent.id);
      }

      const reload = await contentService.getContentById(createdContent.id);
      if (!reload.data) {
        throw new Error('Không thể tải lại nội dung đã tạo');
      }
      createdContent = reload.data;

             if (createdContent.files && createdContent.files.length > 0 && createdContent.files[0].objectKey) {
         await userService.updateMyAvatar(createdContent.files[0].objectKey);
         await fetchProfile();
       } else {
         throw new Error('Không thể cập nhật ảnh đại diện: Không tìm thấy file');
       }

      setAvatar('');
      setAvatarFile(null);
      setAvatarPostBody('');
      onCloseAvatarModal();
      onSuccess('Đã cập nhật ảnh đại diện và chia sẻ thành công!');
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      const errorMessage = error.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại!';
      onError(errorMessage);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleUpdateBackground = async () => {
    if (!user || !backgroundFile) return;

    setIsUpdatingBackground(true);
    try {
      const postRequest: ContentCreateRequest = {
        subtitle: 'đã thay đổi ảnh bìa',
        body: backgroundPostBody.trim(),
        contentTargetType: 'GLOBAL',
        targetId: 0,
        parentId: -1
      };

      let createdContent = await createContent(postRequest);

      if (createdContent.id) {
        await uploadContentFiles(createdContent.id, [backgroundFile]);
        await syncContentFiles(createdContent.id);
      }

      const reload = await contentService.getContentById(createdContent.id);
      if (!reload.data) {
        throw new Error('Không thể tải lại nội dung đã tạo');
      }
      createdContent = reload.data;

             if (createdContent.files && createdContent.files.length > 0 && createdContent.files[0].objectKey) {
         await userService.updateMyBackground(createdContent.files[0].objectKey);
         await fetchProfile();
       } else {
         throw new Error('Không thể cập nhật ảnh bìa: Không tìm thấy file');
       }

      setBackground('');
      setBackgroundFile(null);
      setBackgroundPostBody('');
      onCloseBackgroundModal();
      onSuccess('Đã cập nhật ảnh bìa và chia sẻ thành công!');
    } catch (error: any) {
      console.error('Failed to update background:', error);
      const errorMessage = error.message || 'Không thể cập nhật ảnh bìa. Vui lòng thử lại!';
      onError(errorMessage);
    } finally {
      setIsUpdatingBackground(false);
    }
  };

  const handleCloseAvatarModal = () => {
    setAvatar('');
    setAvatarFile(null);
    setAvatarPostBody('');
    setAvatarCropperFile(null);
    onCloseAvatarModal();
  };

  const handleCloseBackgroundModal = () => {
    setBackground('');
    setBackgroundFile(null);
    setBackgroundPostBody('');
    setBackgroundCropperFile(null);
    onCloseBackgroundModal();
  };

  return (
    <>
      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-0 max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Chọn ảnh đại diện</h3>
              <button
                onClick={handleCloseAvatarModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Show ImageCropper if file is selected for cropping */}
              {avatarCropperFile ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4">Cắt ảnh đại diện</h4>
                  <ImageCropper
                    imageFile={avatarCropperFile}
                    aspectRatio={1}
                    onCropComplete={handleAvatarCropComplete}
                    onCancel={handleAvatarCropCancel}
                    cropType="avatar"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <textarea
                      value={avatarPostBody}
                      onChange={(e) => setAvatarPostBody(e.target.value)}
                      placeholder="Mô tả"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-right text-sm text-gray-400 mt-1">
                      {avatarPostBody.length}/500
                    </div>
                  </div>

                  {avatar && (
                    <div className="text-center mb-6">
                      <div className="relative inline-block">
                        <div className="w-48 h-48 mx-auto rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200">
                          <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-dashed"></div>
                      </div>
                    </div>
                  )}

                  {!avatar && (
                    <div className="text-center mb-6">
                      <div className="w-48 h-48 mx-auto rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Thêm ảnh</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>{avatar ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                      </span>
                    </label>
                  </div>

                  {avatar && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCloseAvatarModal}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={isUpdatingAvatar}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateAvatar}
                        disabled={isUpdatingAvatar}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        {isUpdatingAvatar && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>{isUpdatingAvatar ? 'Đang cập nhật...' : 'Cập nhật'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background Modal */}
      {showBackgroundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-0 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Chọn ảnh bìa</h3>
              <button
                onClick={handleCloseBackgroundModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Show ImageCropper if file is selected for cropping */}
              {backgroundCropperFile ? (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-4">Cắt ảnh bìa</h4>
                  <ImageCropper
                    imageFile={backgroundCropperFile}
                    aspectRatio={16/9}
                    onCropComplete={handleBackgroundCropComplete}
                    onCancel={handleBackgroundCropCancel}
                    cropType="background"
                  />
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <textarea
                      value={backgroundPostBody}
                      onChange={(e) => setBackgroundPostBody(e.target.value)}
                      placeholder="Mô tả"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="text-right text-sm text-gray-400 mt-1">
                      {backgroundPostBody.length}/500
                    </div>
                  </div>

                  {background && (
                    <div className="text-center mb-6">
                      <div className="relative">
                        <div className="w-full h-48 bg-gray-100 border-4 border-gray-200 rounded-lg overflow-hidden">
                          <img src={background} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg"></div>
                      </div>
                    </div>
                  )}

                  {!background && (
                    <div className="text-center mb-6">
                      <div className="w-full h-48 bg-gray-100 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Thêm ảnh bìa</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleBackgroundChange} className="hidden" />
                      <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>{background ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                      </span>
                    </label>
                  </div>

                  {background && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCloseBackgroundModal}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={isUpdatingBackground}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleUpdateBackground}
                        disabled={isUpdatingBackground}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                      >
                        {isUpdatingBackground && (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        <span>{isUpdatingBackground ? 'Đang cập nhật...' : 'Cập nhật'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 