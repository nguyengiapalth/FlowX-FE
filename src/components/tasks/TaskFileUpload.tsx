import React, { useState, useRef, useEffect } from 'react';
import { useProfileStore } from '../../stores/profile-store';
import fileService from '../../services/file.service';
import type { FileResponse, FileCreateRequest } from '../../types/file';
import type { FileTargetType } from '../../types/enums/enums';

interface TaskFileUploadProps {
  taskId: number;
  canUpload: boolean; // Chỉ assigner và assignee mới được upload
  files?: FileResponse[]; // Files từ task response
  onFilesUpdated?: () => void;
}

const TaskFileUpload: React.FC<TaskFileUploadProps> = ({
  taskId,
  canUpload,
  files: propFiles = [],
  onFilesUpdated
}) => {
  const { user } = useProfileStore();
  const [files, setFiles] = useState<FileResponse[]>(propFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(propFiles);
  }, [propFiles]);

  const fetchTaskFiles = async () => {
    try {
      const response = await fileService.getFilesByEntity('TASK', taskId);
      if (response.code === 200 && response.data) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch task files:', error);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      await uploadFiles(Array.from(selectedFiles));
      onFilesUpdated?.(); // This will refresh the task data including files
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Có lỗi xảy ra khi upload file');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    const uploadPromises = filesToUpload.map(async (file) => {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Step 1: Get presigned upload URL
        const fileRequest: FileCreateRequest = {
          name: file.name,
          type: file.type,
          size: file.size,
          targetId: taskId,
          fileTargetType: 'TASK' as FileTargetType,
          visibility: 'TASK'
        };

        const presignedResponse = await fileService.getPresignedUploadUrl(fileRequest);
        
        if (!presignedResponse.data) {
          throw new Error('No presigned URL returned from server');
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));

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

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        console.log('File uploaded successfully:', file.name);
        
        return presignedResponse.data.presignedFileId;
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
        throw error;
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleDownload = async (file: FileResponse) => {
    try {
      const response = await fileService.getPresignedDownloadUrl(file.id);
      if (response.code === 200 && response.data) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = response.data;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      setError('Có lỗi xảy ra khi tải file');
    }
  };

  const handleDelete = async (file: FileResponse) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${file.name}"?`)) return;

    try {
      await fileService.deleteFile(file.id);
      onFilesUpdated?.(); // This will refresh the task data including files
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Có lỗi xảy ra khi xóa file');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const canDeleteFile = (file: FileResponse) => {
    return user?.id === file.uploader.id;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tệp đính kèm</h3>
        {canUpload && (
          <button
            onClick={handleFileSelect}
            disabled={isUploading}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isUploading ? 'Đang upload...' : 'Thêm file'}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="*/*"
      />

      {/* Upload progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Đang upload files...</h4>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="mb-2">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span className="truncate">{fileName}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Files list */}
      {files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>Tải lên bởi {file.uploader.fullName}</span>
                    <span>•</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                  {file.description && (
                    <p className="text-xs text-gray-600 mt-1 truncate">{file.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                  title="Tải xuống"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                {canDeleteFile(file) && (
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                    title="Xóa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Chưa có file nào được đính kèm</p>
          {canUpload && (
            <p className="text-xs mt-1">Nhấn "Thêm file" để upload file đầu tiên</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFileUpload; 