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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-96">
            {/* Modern loading spinner */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
              <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
              <div className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Đang tải nội dung...</h3>
              <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-blue-400/5 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '8s', animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Toast Notification */}
        {toast && (
          <SimpleToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Header with modern styling */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Bảng tin FlowX
          </h1>
          <p className="text-gray-600 text-lg">Kết nối và chia sẻ với toàn công ty</p>
        </div>

        {/* Create Post Section with enhanced styling */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
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
        </div>

        {/* Contents Feed with enhanced styling */}
        <div className="space-y-6">
          {contents.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-12 max-w-md mx-auto">
                {/* Modern empty state icon */}
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Chưa có nội dung nào</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">Hãy tạo bài viết đầu tiên để bắt đầu chia sẻ và kết nối với đồng nghiệp!</p>
                <button
                  onClick={() => {
                    const textarea = document.querySelector('textarea[placeholder*="toàn công ty"]') as HTMLTextAreaElement;
                    if (textarea) textarea.focus();
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tạo bài viết đầu tiên</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {contents.map((content, index) => (
                <div 
                  key={content.id} 
                  className="transform hover:scale-[1.01] transition-all duration-300"
                  style={{ 
                    animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` 
                  }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <ContentCard
                      content={content}
                      onReply={handleReply}
                      onEdit={handleEditContent}
                      onDelete={handleDeleteContent}
                      onViewDetail={handleViewDetail}
                      showReplies={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Load More Button with enhanced styling */}
        {contents.length > 0 && (
          <div className="text-center mt-12">
            <button 
              onClick={refreshContents}
              className="bg-white/80 backdrop-blur-sm text-gray-700 hover:text-white border border-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Làm mới</span>
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
    </div>
  );
};

export default NewsfeedPage; 