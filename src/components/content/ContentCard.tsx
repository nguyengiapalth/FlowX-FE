import React, { useState, useEffect, useRef } from 'react';
import type { ContentResponse } from '../../types/content';
import { ReactionDisplay } from './ReactionDisplay';
import { CommentCard } from './CommentCard';
import { UserAvatarName } from '../shared/UserAvatarName';
import { useContentStore } from '../../stores/content-store';
import { useProfileStore } from '../../stores/profile-store';
import type { FileResponse } from '../../types/file.ts';
import type { ContentCreateRequest } from '../../types/content';
import contentService from '../../services/content.service';
import { getSubtitleDisplay, getContentTargetDisplay } from '../../utils/content.util';

// Simple inline reply form component
const InlineReplyForm: React.FC<{
  contentTargetType: any;
  targetId: number;
  parentId: number;
  parentAuthorName?: string;
  onSubmit: (request: ContentCreateRequest) => Promise<void>;
  onCancel: () => void;
}> = ({ contentTargetType, targetId, parentId, parentAuthorName, onSubmit, onCancel }) =>
{
  const { user } = useProfileStore();
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    try {
      const request: ContentCreateRequest = {
        subtitle: 'reply',
        body: body.trim(),
        contentTargetType,
        targetId,
        parentId
      };
      await onSubmit(request);
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-start space-x-3 mt-3 ml-11">
      {/* Mini Avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200">
        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={parentAuthorName ? `Trả lời ${parentAuthorName}...` : 'Viết phản hồi...'}
            className="w-full px-4 py-3 bg-transparent border-none resize-none text-sm placeholder-gray-500 focus:outline-none rounded-2xl"
            rows={2}
            maxLength={500}
          />
          
          {/* Action Bar */}
          {body.trim() && (
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="text-xs text-gray-400">
                {body.length}/500
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !body.trim()}
                  className="px-4 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

interface ContentCardProps {
  content: ContentResponse;
  onReply?: (parentId: number) => void;
  onEdit?: (content: ContentResponse) => void;
  onDelete?: (id: number) => void;
  onViewDetail?: (contentId: number) => void;
  showReplies?: boolean;
  depth?: number;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  onReply,
  onEdit,
  onDelete,
  onViewDetail,
  showReplies = true,
  depth = 0
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<number | null>(null);
  
  // Reaction state
  const { 
    reactionSummaries, 
    reactionLoading, 
    fetchReactionSummary, 
    addOrUpdateReaction, 
    removeReaction,
    addReplyToContent
  } = useContentStore();
  
  const reactionSummary = reactionSummaries[content.id];
  const isReactionLoading = reactionLoading[content.id] || false;

  // Load reaction summary when component mounts
  useEffect(() => {
    fetchReactionSummary(content.id);
  }, [content.id, fetchReactionSummary]);

  const handleReactionChange = async (reactionType: string | null) => {
    try {
      if (reactionType) {
        await addOrUpdateReaction(content.id, reactionType);
      } else {
        await removeReaction(content.id);
      }
    } catch (error) {
      console.error('Failed to change reaction:', error);
    }
  };

  const handleReplySubmit = async (request: ContentCreateRequest) => {
    try {
      // Create the reply content
      const response = await contentService.createContent(request);
      
      if (response.data) {
        // Add the reply to the current content in the store
        addReplyToContent(content.id, response.data);
        
        // Hide reply form
        setShowReplyForm(false);
        setReplyingToComment(null);
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
      throw error;
    }
  };

  const handleReplyToComment = (commentId: number) => {
    if (onReply) {
      onReply(commentId);
    } else {
      setReplyingToComment(commentId);
      setShowReplyForm(true);
    }
  };

  const handleCancelReply = () => {
    setShowReplyForm(false);
    setReplyingToComment(null);
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getFileIcon = (file: FileResponse) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return '🖼️';
    } else if (['pdf'].includes(extension || '')) {
      return '📄';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return '📊';
    } else if (['zip', 'rar', '7z'].includes(extension || '')) {
      return '📦';
    }
    return '📁';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = (file: FileResponse) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const maxDisplayFiles = 3;
  const displayFiles = showAllFiles ? content.files : content.files?.slice(0, maxDisplayFiles);
  const hasMoreFiles = content.files && content.files.length > maxDisplayFiles;

  // Get random gradient for avatar
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-yellow-500 to-orange-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-red-500 to-pink-600'
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 ${
      depth > 0 ? 'ml-12 mt-4 border-l-4 border-l-blue-200' : 'mb-6'
    }`}>
      {/* Content Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-start space-x-4">
          {/* User Avatar and Name */}
          <UserAvatarName 
            user={{
              id: content.author?.id || 0,
              fullName: content.author?.fullName || 'Unknown User',
              avatar: content.author?.avatar,
              position: content.author?.position,
              email: content.author?.email
            }}
            size="lg"
            showPosition={false}
            clickable={!!content.author?.id}
            className="flex-shrink-0"
          />
          
          {/* Content Meta Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Subtitle (e.g., "đã thay đổi ảnh đại diện") */}
              {getSubtitleDisplay(content.subtitle) && (
                <span className="text-sm text-gray-600">
                  {getSubtitleDisplay(content.subtitle)}
                </span>
              )}
              
              {/* Target Context (e.g., "> Dự án ABC") */}
              {getContentTargetDisplay(content.contentTargetType, content.targetId) && (
                <span className="text-xs text-blue-600 font-medium">
                  {getContentTargetDisplay(content.contentTargetType, content.targetId)}
                </span>
              )}
              
              {content.author?.position && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  {content.author.position}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-500">{formatDate(content.createdAt)}</p>
              {content.hasFile && (
                <span className="flex items-center text-xs text-gray-400">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L9 7.414V15a1 1 0 11-2 0V7.414L5.707 8.707a1 1 0 01-1.414-1.414z" clipRule="evenodd" />
                  </svg>
                  {content.files?.length || 0} tệp
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(content)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Chỉnh sửa"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(content.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Xóa"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="px-6 pb-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-[15px]">
            {showFullContent ? content.body : truncateContent(content.body)}
          </p>
          
          {content.body.length > 300 && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 transition-colors"
            >
              {showFullContent ? '← Thu gọn' : 'Xem thêm →'}
            </button>
          )}
        </div>
      </div>

      {/* Files */}
      {content.hasFile && content.files && content.files.length > 0 && (
        <div className="px-6 pb-4">
          {/* Image Files Grid */}
          {displayFiles?.filter(isImage).length > 0 && (
            <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${
              displayFiles?.filter(isImage).length === 1 ? 'grid-cols-1' :
              displayFiles?.filter(isImage).length === 2 ? 'grid-cols-2' :
              'grid-cols-2 md:grid-cols-3'
            }`}>
              {displayFiles?.filter(isImage).map((file) => (
                <div key={file.id} className="relative group aspect-square overflow-hidden rounded-lg">
                  <img
                    src={file.url || '/placeholder-image.jpg'}
                    alt={file.name}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    onClick={() => window.open(file.url, '_blank')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Non-Image Files */}
          {displayFiles?.filter(file => !isImage(file)).length > 0 && (
            <div className="space-y-3">
              {displayFiles?.filter(file => !isImage(file)).map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 cursor-pointer group border border-gray-200"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-2xl group-hover:shadow-md transition-shadow">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size || 0)} • {file.createdAt ? formatDate(file.createdAt) : 'Không rõ'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show More Files Button */}
          {hasMoreFiles && !showAllFiles && (
            <button
              onClick={() => setShowAllFiles(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1 transition-colors"
            >
              <span>Xem thêm {content.files.length - maxDisplayFiles} tệp</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <ReactionDisplay
              contentId={content.id}
              reactionSummary={reactionSummary}
              onReactionChange={handleReactionChange}
              loading={isReactionLoading}
            />
            
            {onViewDetail && (
              <button 
                onClick={() => onViewDetail(content.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors group"
              >
                <div className="p-2 group-hover:bg-blue-100 rounded-full transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Bình luận</span>
              </button>
            )}

            <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors group">
              <div className="p-2 group-hover:bg-green-100 rounded-full transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Chia sẻ</span>
            </button>
          </div>
          
          {content.replies && content.replies.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{content.replies.length} phản hồi</span>
            </div>
          )}
        </div>
      </div>

      {/* Inline Reply Form for Main Content */}
      {showReplyForm && replyingToComment === content.id && (
        <div className="px-6 pb-4">
          <InlineReplyForm
            contentTargetType={content.contentTargetType}
            targetId={content.targetId}
            parentId={content.id}
            parentAuthorName={content.author?.fullName}
            onSubmit={handleReplySubmit}
            onCancel={handleCancelReply}
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && content.replies && content.replies.length > 0 && (
        <div className="border-t border-gray-100 px-6 py-2">
          {content.replies.map((reply) => (
            <div key={reply.id}>
              <CommentCard
                content={reply}
                onReply={handleReplyToComment}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetail={onViewDetail}
                depth={depth + 1}
              />
              
              {/* Inline Reply Form for Individual Comments */}
              {showReplyForm && replyingToComment === reply.id && (
                <InlineReplyForm
                  contentTargetType={content.contentTargetType}
                  targetId={content.targetId}
                  parentId={reply.id}
                  parentAuthorName={reply.author?.fullName}
                  onSubmit={handleReplySubmit}
                  onCancel={handleCancelReply}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 