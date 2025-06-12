import React from 'react';
import { ContentCard } from './ContentCard.tsx';
// import { ContentCreateForm } from './ContentCreateForm.tsx';
// import { ReplyModal } from './ReplyModal.tsx';
import SimpleToast from '../utils/SimpleToast.tsx';
import type { ContentResponse } from '../../types/content.ts';
import type { ContentTargetType } from '../../types/enums.ts';
import { useTargetContents } from '../../hooks/useContent.ts';
import { RefreshCw } from "lucide-react";

interface DiscussionSectionProps {
  targetType: ContentTargetType;
  targetId: number;
  title: string;
  placeholder?: string;
  onViewDetail?: (contentId: number, content?: ContentResponse) => void;
}

const DiscussionSection: React.FC<DiscussionSectionProps> = ({
  targetType,
  targetId,
  title,
  onViewDetail,
}) => {
  const {
    contents,
    isLoading,
    error,
    refreshContents,
    deleteContent
  } = useTargetContents(targetType, targetId);

  const handleDeleteContent = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa nội dung này?')) return;
    
    try {
      await deleteContent(id);
      // Content will be automatically removed from store
    } catch (error: any) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleEditContent = (content: ContentResponse) => {
    console.log(content);
    // TODO: Implement edit functionality
  };

  const handleViewDetailWrapper = (contentId: number) => {
    if (onViewDetail) {
      const content = contents.find(c => c.id === contentId);
      onViewDetail(contentId, content);
    }
  };

  if (isLoading) {
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

  return (
    <div>
      {/* Error Toast */}
      {error && (
        <SimpleToast
          message={error}
          type="error"
          onClose={() => {}}
        />
      )}

      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={refreshContents}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Làm mới"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onViewDetail={handleViewDetailWrapper}
              showReplies={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DiscussionSection; 