import React, { useState, useRef, useEffect } from 'react';
import { ReactionPicker } from './ReactionPicker';
import { ReactionListModal } from './ReactionListModal';
import { getReactionIcon, formatReactionText } from '../../types/content';
import type { ContentReactionSummary } from '../../types/content';

interface ReactionDisplayProps {
  contentId: number;
  reactionSummary?: ContentReactionSummary | null;
  onReactionChange: (reactionType: string | null) => void;
  loading?: boolean;
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
  contentId,
  reactionSummary,
  onReactionChange,
  loading = false
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTimeout, setPickerTimeout] = useState<number | null>(null);
  const [showReactionList, setShowReactionList] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (pickerTimeout) {
      clearTimeout(pickerTimeout);
      setPickerTimeout(null);
    }
    setShowPicker(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowPicker(false);
    }, 300);
    setPickerTimeout(timeout);
  };

  const handleReactionSelect = async (reactionType: string) => {
    try {
      // If user clicks same reaction, remove it
      if (reactionSummary?.userReaction === reactionType) {
        await onReactionChange(null);
      } else {
        await onReactionChange(reactionType);
      }
      setShowPicker(false);
    } catch (error) {
      console.error('Error handling reaction selection:', error);
    }
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        buttonRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const currentReaction = reactionSummary?.userReaction;
  const totalReactions = reactionSummary?.totalReactions || 0;
  const hasReacted = !!currentReaction;

  // Get most popular reactions for display with better error handling
  const topReactions = reactionSummary?.reactionCounts 
    ? Object.entries(reactionSummary.reactionCounts)
        .filter(([type, count]) => {
          const numCount = Number(count);
          return !isNaN(numCount) && numCount > 0;
        })
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 3)
    : [];

  const handleQuickReaction = async () => {
    try {
      if (currentReaction) {
        await onReactionChange(null);
      } else {
        await onReactionChange('LIKE');
      }
    } catch (error) {
      console.error('Error handling quick reaction:', error);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Like Button with Hover Picker */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={handleQuickReaction}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          disabled={loading}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-200
            ${hasReacted 
              ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
              : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-base">
              {hasReacted ? getReactionIcon(currentReaction) : '👍'}
            </span>
          )}
          <span className="text-sm font-medium">
            {hasReacted ? formatReactionText(currentReaction, 1) : 'Thích'}
          </span>
        </button>

        {/* Reaction Picker */}
        {showPicker && (
          <div
            ref={pickerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="absolute bottom-full mb-2 left-0 z-50 animate-in fade-in duration-200"
          >
            <ReactionPicker
              onReactionSelect={handleReactionSelect}
              currentReaction={currentReaction}
            />
          </div>
        )}
      </div>

      {/* Reaction Summary */}
      {totalReactions > 0 && (
        <button
          onClick={() => setShowReactionList(true)}
          className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer hover:underline"
        >
          {/* Top reaction icons */}
          <div className="flex -space-x-1">
            {topReactions.map(([type], index) => (
              <span
                key={type}
                className="w-5 h-5 bg-white rounded-full border border-gray-200 flex items-center justify-center text-xs"
                style={{ zIndex: topReactions.length - index }}
              >
                {getReactionIcon(type)}
              </span>
            ))}
          </div>
          
          {/* Count */}
          <span className="ml-1">
            {totalReactions === 1 ? '1 người' : `${totalReactions} người`}
          </span>
        </button>
      )}

      {/* Reaction List Modal */}
      <ReactionListModal
        isOpen={showReactionList}
        onClose={() => setShowReactionList(false)}
        contentId={contentId}
        totalReactions={totalReactions}
      />
    </div>
  );
}; 