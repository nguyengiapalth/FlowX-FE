import React from 'react';
import { getReactionIcon } from '../../types/content';

interface ReactionPickerProps {
  onReactionSelect: (reactionType: string) => void;
  currentReaction?: string | null;
  className?: string;
}

const reactionTypes = [
  { type: 'LIKE', label: 'Thích' },
  { type: 'LOVE', label: 'Yêu thích' },
  { type: 'HAHA', label: 'Cười' },
  { type: 'WOW', label: 'Ngạc nhiên' },
  { type: 'SAD', label: 'Buồn' },
  { type: 'ANGRY', label: 'Tức giận' }
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  onReactionSelect,
  currentReaction,
  className = ''
}) => {
  return (
    <div className={`bg-white border rounded-lg shadow-lg p-2 flex space-x-1 ${className}`}>
      {reactionTypes.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => onReactionSelect(reaction.type)}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg
            hover:bg-gray-100 transition-all duration-200 hover:scale-110
            ${currentReaction === reaction.type ? 'bg-blue-100 scale-110' : ''}
          `}
          title={reaction.label}
        >
          {getReactionIcon(reaction.type)}
        </button>
      ))}
    </div>
  );
}; 