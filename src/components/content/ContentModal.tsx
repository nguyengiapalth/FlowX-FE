import React, { useState, useEffect } from 'react';
import { ContentCard } from './ContentCard';
import { CommentCard } from './CommentCard';
import { ExpandableCreateForm } from './ExpandableCreateForm';
import { useContentStore } from '../../stores/content-store';
import type { ContentResponse, ContentCreateRequest } from '../../types/content';
import type { FileCreateRequest } from '../../types/file';
import fileService from '../../services/file.service';
import {ReplyIcon, X} from 'lucide-react';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number;
  showReplyForm?: boolean;
  onContentUpdate?: () => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  contentId,
  showReplyForm = false,
  onContentUpdate
}) => {
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyFormState, setShowReplyFormState] = useState(showReplyForm);

  const { 
    contents,
    createContent,
    fetchContentById,
    deleteContent,
    syncContentFiles
  } = useContentStore();

  // Load content when modal opens
  useEffect(() => {
    if (isOpen && contentId) {
      loadContent();
    }
  }, [isOpen, contentId]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to get from store first
      const existingContent = contents.find(c => c.id === contentId);
      if (existingContent) {
        setContent(existingContent);
        setIsLoading(false);
        return;
      }

      // If not in store, fetch from API
      await fetchContentById(contentId);
      const fetchedContent = contents.find(c => c.id === contentId);
      
      if (fetchedContent) {
        setContent(fetchedContent);
      } else {
        setError('Không thể tải nội dung');
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      setError('Có lỗi xảy ra khi tải nội dung');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReply = async (request: ContentCreateRequest, files?: File[]) => {
    if (!content) return;

    try {
      // First, create the reply
      const createdReply = await createContent({
        ...request,
        contentTargetType: content.contentTargetType,
        targetId: content.targetId,
        parentId: content.id
      });

      // If there are files, upload them
      if (files && files.length > 0 && createdReply.id) {
        await uploadContentFiles(createdReply.id, files);
        
        // Sync the content to update hasFile flag
        await syncContentFiles(createdReply.id);
      }
      
      // Reload content to get updated replies
      await loadContent();
      setShowReplyFormState(false);
      
      if (onContentUpdate) {
        onContentUpdate();
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
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

  const handleReply = (parentId: number) => {
    console.log('Reply:', parentId);
    setShowReplyFormState(true);
  };

  const handleEdit = (content: ContentResponse) => {
    // TODO: Implement edit functionality
    console.log('Edit content:', content);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    
    try {
      await deleteContent(id);
      if (onContentUpdate) {
        onContentUpdate();
      }
      onClose();
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseModal = () => {
    setShowReplyFormState(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              <ReplyIcon className='w-6 h-6' />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Chi tiết bài viết</h2>
              <p className="text-sm text-gray-500">Xem và tương tác với nội dung</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowReplyFormState(!showReplyFormState)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
              <ReplyIcon className='w-6 h-6' />
              <span>{showReplyFormState ? 'Hủy trả lời' : 'Trả lời'}</span>
            </button>
            
            <button
              onClick={handleCloseModal}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải nội dung...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl text-gray-400 mb-4">😞</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không thể tải nội dung</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          ) : content ? (
            <div className="p-6 space-y-6">
              {/* Main Content - Full Display */}
              <div className="bg-gray-50 rounded-xl p-6">
                <ContentCard
                  content={content}
                  onReply={handleReply}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  showReplies={false}
                />
              </div>

              {/* Reply Form */}
              {showReplyFormState && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Trả lời bài viết</h3>
                    <p className="text-sm text-gray-600">
                      Trả lời bài viết của <span className="font-medium text-blue-600">{content.author?.fullName}</span>
                    </p>
                  </div>
                  
                  <ExpandableCreateForm
                    contentTargetType={content.contentTargetType}
                    targetId={content.targetId}
                    parentId={content.id}
                    onSubmit={handleCreateReply}
                    placeholder={`Trả lời ${content.author?.fullName}...`}
                    compactPlaceholder="Viết phản hồi của bạn..."
                    autoFocus={true}
                  />
                </div>
              )}

              {/* Comments/Replies Section */}
              {content.replies && content.replies.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bình luận ({content.replies.length})
                    </h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {content.replies.map((reply) => (
                      <div key={reply.id} className="bg-white rounded-xl p-4 border border-gray-200">
                        <CommentCard
                          content={reply}
                          onReply={handleReply}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State for Comments */}
              {(!content.replies || content.replies.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bình luận nào</h3>
                  <p className="text-gray-600 mb-4">Hãy là người đầu tiên bình luận về bài viết này</p>
                  {!showReplyFormState && (
                    <button
                      onClick={() => setShowReplyFormState(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Viết bình luận đầu tiên
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-6xl text-gray-400 mb-4">❓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nội dung</h3>
                <p className="text-gray-600">Nội dung có thể đã bị xóa hoặc không tồn tại</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 