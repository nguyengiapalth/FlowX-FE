import React, { useState, useEffect } from 'react';
import { ReactionDisplay } from './ReactionDisplay';
import { useContentStore } from '../../stores/content-store';
import type { ContentResponse } from '../../types/content.ts';
import type { FileResponse } from '../../types/file.ts';
import {Edit, Trash2, Upload, Download} from 'lucide-react';

interface CommentCardProps {
  content: ContentResponse;
  onReply?: (parentId: number) => void;
  onEdit?: (content: ContentResponse) => void;
  onDelete?: (id: number) => void;
  onViewDetail?: (contentId: number) => void;
  depth?: number;
}

export const CommentCard: React.FC<CommentCardProps> = ({
  content,
  onReply,
  onEdit,
  onDelete,
  onViewDetail,
  depth = 0
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  
  // Reaction state
  const { 
    reactionSummaries, 
    reactionLoading, 
    fetchReactionSummary, 
    addOrUpdateReaction, 
    removeReaction 
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

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes}p`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (text: string, maxLength: number = 200) => {
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
    }
    return '📁';
  };

  const isImage = (file: FileResponse) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  // Get avatar gradient
  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600', 
      'from-yellow-400 to-orange-500',
      'from-pink-400 to-pink-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600'
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className={`group flex space-x-3 py-3 ${depth > 0 ? 'ml-8' : ''}`}>
      {/* Compact Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarGradient(content.author?.fullName || 'U')} rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm`}>
          {content.author?.fullName?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        {/* Comment Bubble */}
        <div className="bg-gray-100 rounded-2xl px-4 py-3 relative">
          {/* Author & Content */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 text-sm hover:text-blue-600 cursor-pointer transition-colors">
                {content.author?.fullName || 'Unknown User'}
              </span>
              <span className="text-xs text-gray-500">{formatDate(content.createdAt)}</span>
            </div>
            
            <div className="text-sm text-gray-800 leading-relaxed">
              <p className="whitespace-pre-wrap">
                {showFullContent ? content.body : truncateContent(content.body)}
              </p>
              
              {content.body.length > 200 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-1 transition-colors"
                >
                  {showFullContent ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>

            {/* Files - Compact View */}
            {content.hasFile && content.files && content.files.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowFiles(!showFiles)}
                  className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{content.files.length} tệp</span>
                </button>

                {showFiles && (
                  <div className="mt-2 space-y-2">
                    {/* Images - Small Grid */}
                    {content.files.filter(isImage).length > 0 && (
                      <div className="grid grid-cols-3 gap-1">
                        {content.files.filter(isImage).slice(0, 3).map((file) => (
                          <div key={file.id} className="aspect-square rounded-lg overflow-hidden">
                            <img
                              src={file.url || '/placeholder-image.jpg'}
                              alt={file.name}
                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.open(file.url, '_blank')}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Non-image files - Minimal list */}
                    {content.files.filter(file => !isImage(file)).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-2 p-2 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <span className="text-lg">{getFileIcon(file)}</span>
                        <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>
                        <Download className="w-4 h-4 mr-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions Menu - Hidden by default */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  onClick={() => onEdit(content)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-colors"
                  title="Chỉnh sửa"
                >
                    <Edit className="w-3 h-3" />
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => onDelete(content.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                  title="Xóa"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 mt-1 ml-2">
          <div className="flex items-center">
            <ReactionDisplay
              contentId={content.id}
              reactionSummary={reactionSummary}
              onReactionChange={handleReactionChange}
              loading={isReactionLoading}
            />
          </div>
          
          {onReply && (
            <button
              onClick={() => onReply(content.id)}
              className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
            >
              Trả lời
            </button>
          )}

          {onViewDetail && (
            <button
              onClick={() => onViewDetail(content.id)}
              className="text-xs text-gray-500 hover:text-purple-600 font-medium transition-colors"
            >
              Chi tiết
            </button>
          )}

          {content.replies && content.replies.length > 0 && (
            <span className="text-xs text-gray-500">
              {content.replies.length} phản hồi
            </span>
          )}
        </div>

        {/* Nested Replies */}
        {content.replies && content.replies.length > 0 && (
          <div className="mt-3 space-y-2">
            {content.replies.map((reply) => (
              <CommentCard
                key={reply.id}
                content={reply}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewDetail={onViewDetail}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 