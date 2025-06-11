import React, { useState } from 'react';
import { ImageCropper } from '../utils/ImageCropper';
import { useContentStore } from '../../stores/content-store';
import { X, Plus, Upload, Info, Loader2 } from 'lucide-react';
import fileService from '../../services/file.service';
import contentService from '../../services/content.service';
import type { ContentCreateRequest } from '../../types/content';
import type { FileCreateRequest } from '../../types/file';
import type { ContentTargetType } from '../../types/enums/enums';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  title?: string;
  targetType: ContentTargetType;
  targetId: number;
  targetName: string;
  onBackgroundUpdate: (objectKey: string) => Promise<void>;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
  title = "Chọn ảnh bìa",
  targetType,
  targetId,
  targetName,
  onBackgroundUpdate
}) => {
  const { createContent, syncContentFiles } = useContentStore();

  // States
  const [background, setBackground] = useState<string>('');
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [postBody, setPostBody] = useState<string>('');
  const [cropperFile, setCropperFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setCropperFile(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    console.log('Background crop completed:', { url, fileSize: croppedFile.size });
    
    setBackground(url);
    setBackgroundFile(croppedFile);
    setPostBody('');
    setCropperFile(null);
  };

  const handleCropCancel = () => {
    setCropperFile(null);
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

  const getSubtitle = () => {
    switch (targetType) {
      case 'DEPARTMENT':
        return `đã thay đổi ảnh bìa của ${targetName}`;
      case 'PROJECT':
        return `đã thay đổi ảnh bìa của ${targetName}`;
      case 'GLOBAL':
        return 'đã thay đổi ảnh bìa';
      default:
        return 'đã thay đổi ảnh bìa';
    }
  };

  const getSuccessMessage = () => {
    switch (targetType) {
      case 'DEPARTMENT':
        return 'Đã cập nhật ảnh bìa phòng ban và chia sẻ thành công!';
      case 'PROJECT':
        return 'Đã cập nhật ảnh bìa dự án và chia sẻ thành công!';
      case 'GLOBAL':
        return 'Đã cập nhật ảnh bìa và chia sẻ thành công!';
      default:
        return 'Đã cập nhật ảnh bìa thành công!';
    }
  };

  const handleUpdate = async () => {
    if (!backgroundFile) return;

    setIsUpdating(true);
    try {
      // Step 1: Create post with background file
      const postRequest: ContentCreateRequest = {
        subtitle: getSubtitle(),
        body: postBody.trim(),
        contentTargetType: targetType,
        targetId: targetId,
        parentId: -1
      };

      let createdContent = await createContent(postRequest);

      // Step 2: Upload file
      if (createdContent.id) {
        await uploadContentFiles(createdContent.id, [backgroundFile]);
        await syncContentFiles(createdContent.id);
      }

      // Step 3: Reload content to get objectKey
      const reload = await contentService.getContentById(createdContent.id);
      if (!reload.data) {
        throw new Error('Không thể tải lại nội dung đã tạo');
      }
      createdContent = reload.data;

      // Step 4: Update background via callback
      if (createdContent.files && createdContent.files.length > 0 && createdContent.files[0].objectKey) {
        await onBackgroundUpdate(createdContent.files[0].objectKey);
      } else {
        throw new Error('Không thể cập nhật ảnh bìa: Không tìm thấy file');
      }

      handleClose();
      onSuccess(getSuccessMessage());
    } catch (error: any) {
      console.error('Failed to update background:', error);
      const errorMessage = error.message || 'Không thể cập nhật ảnh bìa. Vui lòng thử lại!';
      onError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setBackground('');
    setBackgroundFile(null);
    setPostBody('');
    setCropperFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-0 max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Show ImageCropper if file is selected for cropping */}
          {cropperFile ? (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-4">Cắt ảnh bìa</h4>
              <ImageCropper
                imageFile={cropperFile}
                aspectRatio={16/9}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
                cropType="background"
              />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <textarea
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  placeholder="Mô tả"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-400 mt-1">
                  {postBody.length}/500
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
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>{background ? 'Thay đổi ảnh' : 'Chọn ảnh'}</span>
                  </span>
                </label>
              </div>

              {background && (
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={isUpdating}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {isUpdating && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>{isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 