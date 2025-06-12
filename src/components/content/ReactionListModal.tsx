import React, { useState, useEffect } from 'react';
import { getReactionIcon, formatReactionText } from '../../types/content';
import { formatTimeAgo } from '../../utils/format.util';
import { UserAvatar } from '../shared/UserAvatar';
import { UserNameCard } from '../shared/UserNameCard';
import type { ContentReactionResponse } from '../../types/content';
import contentReactionService from '../../services/contentReaction.service';
import { 
  X, 
  Users 
} from 'lucide-react';

interface ReactionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: number;
  totalReactions: number;
}

type ReactionTab = 'ALL' | 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

const reactionTabs: { key: ReactionTab; label: string; icon: string }[] = [
  { key: 'ALL', label: 'Tất cả', icon: '👍' },
  { key: 'LIKE', label: 'Thích', icon: '👍' },
  { key: 'LOVE', label: 'Yêu thích', icon: '❤️' },
  { key: 'HAHA', label: 'Cười', icon: '😂' },
  { key: 'WOW', label: 'Ngạc nhiên', icon: '😮' },
  { key: 'SAD', label: 'Buồn', icon: '😢' },
  { key: 'ANGRY', label: 'Tức giận', icon: '😠' }
];

export const ReactionListModal: React.FC<ReactionListModalProps> = ({
  isOpen,
  onClose,
  contentId,
  totalReactions
}) => {
  const [reactions, setReactions] = useState<ContentReactionResponse[]>([]);
  const [filteredReactions, setFilteredReactions] = useState<ContentReactionResponse[]>([]);
  const [activeTab, setActiveTab] = useState<ReactionTab>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchReactions();
    }
  }, [isOpen, contentId]);

  useEffect(() => {
    filterReactions();
  }, [reactions, activeTab]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contentReactionService.getReactionsByContent(contentId);
      
      if (response.code === 200 && response.data) {
        setReactions(response.data);
      } else {
        setError('Không thể tải danh sách reactions');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch reactions:', err);
      setError('Có lỗi xảy ra khi tải danh sách reactions');
    } finally {
      setLoading(false);
    }
  };

  const filterReactions = () => {
    if (activeTab === 'ALL') {
      setFilteredReactions(reactions);
    } else {
      setFilteredReactions(reactions.filter(reaction => reaction.reactionType === activeTab));
    }
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    reactions.forEach(reaction => {
      counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    });
    return counts;
  };

  if (!isOpen) return null;

  const reactionCounts = getReactionCounts();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reactions ({totalReactions})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {reactionTabs.map((tab) => {
              const count = tab.key === 'ALL' ? reactions.length : (reactionCounts[tab.key] || 0);
              
              if (tab.key !== 'ALL' && count === 0) return null;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.key 
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="bg-white bg-opacity-70 px-1.5 py-0.5 rounded-full text-xs">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Users className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">{error}</p>
              <button
                onClick={fetchReactions}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : filteredReactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <span className="text-4xl mb-4">😔</span>
              <p className="text-gray-500 text-center">
                {activeTab === 'ALL' ? 'Chưa có reaction nào' : `Chưa có ai ${formatReactionText(activeTab, 1)}`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredReactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {/* User Avatar */}
                    <UserAvatar 
                      user={{
                        id: reaction.user?.id || 0,
                        fullName: reaction.user?.fullName || 'Người dùng ẩn danh',
                        avatar: reaction.user?.avatar
                      }}
                      size="md"
                      clickable={!!reaction.user?.id}
                    />
                    
                    {/* User Info */}
                    <UserNameCard 
                      user={{
                        id: reaction.user?.id || 0,
                        fullName: reaction.user?.fullName || 'Người dùng ẩn danh',
                        position: reaction.user?.position,
                        email: reaction.user?.email
                      }}
                      size="sm"
                      showTime={true}
                      time={formatTimeAgo(reaction.createdAt)}
                      clickable={!!reaction.user?.id}
                      variant="minimal"
                      layout="horizontal"
                      className="flex-1 min-w-0"
                    />
                  </div>
                  
                  {/* Reaction Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-lg">
                        {getReactionIcon(reaction.reactionType)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 