import React, { useState } from 'react';
import type { ContentResponse } from '../../types/content';
import { ContentCard } from './ContentCard';
import { ContentModal } from './ContentModal';
import { useUserContents, useGlobalContents } from '../../hooks/useContent';
import { useContentAutoRefresh } from '../../hooks/useContentAutoRefresh';
import { AutoRefreshControl } from '../shared/AutoRefreshControl';
import {
  Info,
  ImageIcon
} from "lucide-react";

interface ContentListProps {
  userId?: number; // Nếu có userId thì lấy content của user đó, nếu không thì lấy global content
  showCreatePost?: boolean;
  showAutoRefresh?: boolean; // Hiển thị điều khiển auto refresh
  autoRefreshInterval?: number; // Khoảng thời gian auto refresh
}

export const ContentList: React.FC<ContentListProps> = ({ 
  userId, 
  showCreatePost = false,
  showAutoRefresh = true,
  autoRefreshInterval = 30000
}) => {
  const [selectedContent, setSelectedContent] = useState<ContentResponse | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(autoRefreshInterval);

  // Use appropriate hook based on userId
  const { contents, isLoading, error, deleteContent } = userId 
    ? useUserContents(userId)
    : useGlobalContents();

  // Auto refresh hook
  const autoRefresh = useContentAutoRefresh({
    enabled: showAutoRefresh,
    interval: refreshInterval,
    refreshType: userId ? 'user' : 'global',
    userId: userId
  });

  const handleViewDetail = (contentId: number) => {
    const content = contents.find(c => c.id === contentId);
    if (content) {
      setSelectedContent(content);
      setShowContentModal(true);
    }
  };

  const handleEditContent = (content: ContentResponse) => {
    // Implement edit functionality if needed
    console.log('Edit content:', content);
  };

  const handleDeleteContent = async (id: number) => {
    try {
      await deleteContent(id);
      // Content will be automatically removed from store
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex">
          <Info className='w-5 h-5'/>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi tải bài viết</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Auto Refresh Control */}
        {showAutoRefresh && (
          <AutoRefreshControl
            isRefreshing={autoRefresh.isRefreshing}
            isActive={autoRefresh.isAutoRefreshActive}
            lastRefreshTime={autoRefresh.lastRefreshTime}
            onToggle={autoRefresh.toggleAutoRefresh}
            onRefreshNow={autoRefresh.refreshNow}
            onIntervalChange={setRefreshInterval}
            currentInterval={refreshInterval}
            compact={true}
            className="mb-4"
          />
        )}

        {/* Create Post Section - chỉ hiển thị nếu showCreatePost = true */}
        {showCreatePost && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-full px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors">
                  <span className="text-gray-500">Bạn đang nghĩ gì?</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Ảnh/video</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content List */}
        {contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {userId ? 'Chưa có bài viết nào' : 'Chưa có bài viết global nào'}
            </h3>
            <p className="text-gray-500">
              {userId ? 'Người dùng này chưa đăng bài viết nào.' : 'Hãy là người đầu tiên chia sẻ!'}
            </p>
          </div>
        ) : (
          contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onEdit={handleEditContent}
              onDelete={handleDeleteContent}
              onViewDetail={handleViewDetail}
              showReplies={true}
            />
          ))
        )}
      </div>

      {/* Content Detail Modal */}
      {showContentModal && selectedContent && (
        <ContentModal
          contentId={selectedContent.id}
          isOpen={showContentModal}
          onClose={() => {
            setShowContentModal(false);
            setSelectedContent(null);
          }}
        />
      )}
    </>
  );
}; 