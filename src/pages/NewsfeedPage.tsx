import React, { useState, useEffect } from 'react';
import { ExpandableCreateForm } from '../components/content/ExpandableCreateForm';
import { ContentCard } from '../components/content/ContentCard';
import { ContentModal } from '../components/content/ContentModal';
import SimpleToast from '../components/utils/SimpleToast';
import { useAllContents } from '../hooks/useContent';
import fileService from '../services/file.service';
import type { ContentCreateRequest } from '../types/content';
import type { FileCreateRequest } from '../types/file';

const NewsfeedPage: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);

  const {
    contents,
    isLoading,
    error,
    refreshContents,
    createContent,
    deleteContent
  } = useAllContents();

  const handleCreateContent = async (request: ContentCreateRequest, files?: File[]) => {
    try {
      // Create the content first
      const newContent = await createContent(request);
      
      // If there are files, upload them
      if (files && files.length > 0) {
        await uploadContentFiles(newContent.id, files);
        
        // Sync the content to update hasFile flag
        // await syncContentFiles(newContent.id);
      }
      
      setToast({ 
        message: 'Đã tạo bài viết thành công!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Failed to create content:', error);
      setToast({ 
        message: error.message || 'Không thể tạo bài viết. Vui lòng thử lại.', 
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

  const handleDeleteContent = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    
    try {
      await deleteContent(id);
      setToast({ 
        message: 'Đã xóa nội dung thành công!', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Failed to delete content:', error);
      setToast({ 
        message: error.message || 'Không thể xóa nội dung. Vui lòng thử lại.', 
        type: 'error' 
      });
    }
  };

  const handleViewDetail = (contentId: number) => {
    setSelectedContentId(contentId);
    setShowContentModal(true);
  };

  const handleReply = (parentId: number) => {
    setSelectedContentId(parentId);
    setShowContentModal(true);
  };

  const closeContentModal = () => {
    setShowContentModal(false);
    setSelectedContentId(null);
  };

  const handleEditContent = (content: any) => {
    setToast({ 
      message: 'Tính năng chỉnh sửa đang được phát triển', 
      type: 'error' 
    });
  };

  // Show error from store
  useEffect(() => {
    if (error) {
      setToast({ 
        message: error, 
        type: 'error' 
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600 mt-4">Đang tải nội dung...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bảng tin</h1>
        <p className="text-gray-600">Cập nhật tin tức và hoạt động mới nhất từ toàn công ty, phòng ban và dự án</p>
      </div>

      {/* Create Post Section */}
      <div className="mb-8">
        <ExpandableCreateForm
          contentTargetType="GLOBAL"
          targetId={0}
          parentId={-1}
          onSubmit={handleCreateContent}
          placeholder="Chia sẻ những suy nghĩ của bạn với toàn công ty..."
          compactPlaceholder="Chia sẻ với toàn công ty..."
          autoFocus={false}
        />
      </div>

      {/* Contents Feed */}
      <div className="space-y-6">
        {contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có nội dung nào</h3>
            <p className="text-gray-500 mb-6">Hãy tạo bài viết đầu tiên để bắt đầu chia sẻ!</p>
            <button
              onClick={() => {
                const textarea = document.querySelector('textarea[placeholder*="toàn công ty"]') as HTMLTextAreaElement;
                if (textarea) textarea.focus();
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Tạo bài viết đầu tiên
            </button>
          </div>
        ) : (
          contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onReply={handleReply}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onViewDetail={handleViewDetail}
              showReplies={true}
            />
          ))
        )}
      </div>

      {/* Load More Button */}
      {contents.length > 0 && (
        <div className="text-center mt-8">
          <button 
            onClick={refreshContents}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Làm mới
          </button>
        </div>
      )}

      {/* Content Modal */}
      {showContentModal && selectedContentId && (
        <ContentModal
          isOpen={showContentModal}
          onClose={closeContentModal}
          contentId={selectedContentId}
          showReplyForm={true}
          onContentUpdate={refreshContents}
        />
      )}
    </div>
  );
};

export default NewsfeedPage; 