import React, { useState, useEffect } from 'react';
import { ContentCard } from './ContentCard.tsx';
// import { ContentCreateForm } from './ContentCreateForm.tsx';
// import { ReplyModal } from './ReplyModal.tsx';
import SimpleToast from '../utils/SimpleToast.tsx';
import contentService from '../../services/content.service.ts';
import type { ContentResponse, ContentCreateRequest } from '../../types/content.ts';
import type { ContentTargetType } from '../../types/enums/enums.ts';
import {RefreshCw} from "lucide-react";

interface DiscussionSectionProps {
  targetType: ContentTargetType;
  targetId: number;
  title: string;
  placeholder?: string;
}

const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  targetType,
  targetId,
  title,
  placeholder = 'Chia sẻ suy nghĩ của bạn...'
}) => {
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyParent, setReplyParent] = useState<ContentResponse | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadContents();
  }, [targetType, targetId]);

  const loadContents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await contentService.getContentsByTarget(targetType, targetId);
      
      if (response.code === 200 && response.data) {
        // Tách bài viết gốc và bình luận
        const allContents = response.data;
        const posts = allContents.filter(content => content.parentId === -1);
        const comments = allContents.filter(content => content.parentId !== -1);
        
        // Gắn bình luận vào bài viết tương ứng
        const postsWithComments = posts.map(post => ({
          ...post,
          replies: comments.filter(comment => comment.parentId === post.id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        }));
        
        // Sắp xếp bài viết theo thời gian (mới nhất trước)
        const sortedContents = postsWithComments.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setContents(sortedContents);
        
        if (isRefresh) {
          setToast({ 
            message: 'Đã cập nhật thảo luận mới nhất!', 
            type: 'success' 
          });
        }
      } else {
        setContents([]);
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
      setToast({ 
        message: 'Không thể tải thảo luận. Vui lòng thử lại sau.', 
        type: 'error' 
      });
      setContents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadContents(true);
  };

  const handleDeleteContent = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    
    try {
      const response = await contentService.deleteContent(id);
      
      if (response.code === 200) {
        // Xóa bài viết hoặc bình luận
        setContents(prev => {
          return prev.map(content => {
            if (content.id === id) {
              // Xóa bài viết chính
              return null;
            } else {
              // Xóa bình luận trong replies
              return {
                ...content,
                replies: content.replies.filter(reply => reply.id !== id)
              };
            }
          }).filter(Boolean) as ContentResponse[];
        });
        
        setToast({ 
          message: 'Đã xóa nội dung thành công!', 
          type: 'success' 
        });
      } else {
        throw new Error(response.message || 'Không thể xóa nội dung');
      }
    } catch (error: any) {
      console.error('Failed to delete content:', error);
      setToast({ 
        message: error.message || 'Không thể xóa nội dung. Vui lòng thử lại.', 
        type: 'error' 
      });
    }
  };

  const handleReply = (parentId: number) => {
    // Tìm content cha để hiển thị thông tin trong modal
    const parentContent = contents.find(content => content.id === parentId);
    if (parentContent) {
      setReplyParent(parentContent);
      setShowReplyModal(true);
    }
  };

  // const handleReplySubmit = async (request: ContentCreateRequest) => {
  //   try {
  //     const response = await contentService.createContent(request);
  //
  //     if (response.code === 200 && response.data) {
  //       // Thêm reply vào bài viết tương ứng
  //       setContents(prev =>
  //         prev.map(content =>
  //           content.id === request.parentId
  //             ? { ...content, replies: [...content.replies, response.data!] }
  //             : content
  //         )
  //       );
  //
  //       setToast({
  //         message: 'Đã thêm bình luận thành công!',
  //         type: 'success'
  //       });
  //     }
  //   } catch (error: any) {
  //     console.error('Failed to create reply:', error);
  //     setToast({
  //       message: 'Không thể thêm bình luận. Vui lòng thử lại.',
  //       type: 'error'
  //     });
  //     throw error;
  //   }
  // };

  // const closeReplyModal = () => {
  //   setShowReplyModal(false);
  //   setReplyParent(null);
  // };

  const handleEditContent = (content: ContentResponse) => {
    console.log(content);
    setToast({ 
      message: 'Tính năng chỉnh sửa đang được phát triển', 
      type: 'error' 
    });
  };

  const getTotalPostsAndComments = () => {
    const totalPosts = contents.length;
    const totalComments = contents.reduce((sum, content) => sum + content.replies.length, 0);
    return { totalPosts, totalComments };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Đang tải thảo luận...</span>
        </div>
      </div>
    );
  }

  const { totalPosts, totalComments } = getTotalPostsAndComments();

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {totalPosts} bài viết • {totalComments} bình luận
          </p>
        </div>
        
        <div className="flex items-center space-x-3">

          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Contents */}
      <div className="space-y-4">
        {contents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">💬</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Chưa có thảo luận nào</h4>
            <p className="text-gray-500 mb-4">Hãy bắt đầu cuộc thảo luận đầu tiên!</p>
          </div>
        ) : (
          contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onReply={handleReply}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              showReplies={true}
            />
          ))
        )}
      </div>

      {/*/!* Reply Modal *!/*/}
      {/*{showReplyModal && replyParent && (*/}
      {/*  <ReplyModal*/}
      {/*    isOpen={showReplyModal}*/}
      {/*    onClose={closeReplyModal}*/}
      {/*    contentTargetType={targetType}*/}
      {/*    targetId={targetId}*/}
      {/*    parentId={replyParent.id}*/}
      {/*    onSubmit={handleReplySubmit}*/}
      {/*    parentAuthor={replyParent.author.fullName}*/}
      {/*    parentContent={replyParent.body}*/}
      {/*  />*/}
      {/*)}*/}
    </div>
  );
};

export default DiscussionSection; 