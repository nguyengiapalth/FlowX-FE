import React, { useState, useRef } from 'react';
import { useProfileStore } from '../../stores/profile-store';
import type { ContentCreateRequest } from '../../types/content';
import {
  X, 
  Image, 
  Upload,
  FileText, 
  Loader2, 
} from 'lucide-react';
import type { ContentTargetType } from '../../types/enums/enums';
import { formatFileSize, getFileIcon } from '../../utils/format.util';

interface ExpandableCreateFormProps {
  contentTargetType: ContentTargetType;
  targetId: number;
  parentId?: number; // -1 for posts, other number for replies
  onSubmit: (request: ContentCreateRequest, files?: File[]) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  compactPlaceholder?: string;
  autoFocus?: boolean;
  parentAuthorName?: string;
}

export const ExpandableCreateForm: React.FC<ExpandableCreateFormProps> = ({
  contentTargetType,
  targetId,
  parentId = -1,
  onSubmit,
  onCancel,
  placeholder = "Bạn đang nghĩ gì?",
  compactPlaceholder = "Chia sẻ với toàn công ty...",
  autoFocus = false,
  parentAuthorName
}) => {
  const { user } = useProfileStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReply = parentId !== -1;
  const maxLength = isReply ? 1000 : 2000;
  
  // Emoji lists
  const popularEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💪', '🚀', '✨', '👏', '🤔', '😍', '💯', '🙌', '⚡'];
  const quickEmojis = ['👍', '❤️', '😂', '😊', '🎉', '🤔', '👏', '💯'];

  React.useEffect(() => {
    if (autoFocus && isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, isExpanded]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const handleCollapse = () => {
    if (!body.trim() && files.length === 0) {
      setIsExpanded(false);
      setShowEmojiPicker(false);
      if (onCancel) onCancel();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!body.trim() && files.length === 0) return;

    setIsSubmitting(true);
    try {
      const request: ContentCreateRequest = {
        subtitle: '', // Empty subtitle for now
        body: body.trim(),
        contentTargetType,
        targetId,
        parentId
      };

      await onSubmit(request, files);
      
      // Reset form
      setBody('');
      setFiles([]);
      setIsExpanded(false);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to create content:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
    
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const insertEmoji = (emoji: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newBody = body.substring(0, start) + emoji + body.substring(end);
      setBody(newBody);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length);
        }
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const renderFilePreview = (file: File, index: number) => {
    if (file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      return (
        <div key={index} className="relative">
          <img 
            src={imageUrl} 
            alt={file.name}
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={() => removeFile(index)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getFileIcon(file)}</span>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="text-red-500 hover:text-red-700 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!isExpanded) {
    // Compact Mode
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${isReply ? 'bg-gray-50' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden bg-gray-200 flex-shrink-0`}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {/* Parent author mention for replies */}
            {isReply && parentAuthorName && (
              <div className="text-sm text-blue-600 mb-1">
                Trả lời @{parentAuthorName}
              </div>
            )}
            
            <button
              onClick={handleExpand}
              className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
            >
              {isReply ? 'Viết bình luận...' : compactPlaceholder}
            </button>
          </div>
        </div>
        
        {/* Compact toolbar */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                handleExpand();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Ảnh</span>
            </button>
            <button
              onClick={() => {
                handleExpand();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Tệp</span>
            </button>
            <button
              onClick={handleExpand}
              className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors"
            >
              <span className="text-lg">😊</span>
              <span className="text-sm font-medium">Cảm xúc</span>
            </button>
          </div>
          
          <button
            onClick={handleExpand}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {isReply ? 'Bình luận' : 'Đăng bài'}
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
        />
      </div>
    );
  }

  // Expanded Mode
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${isReply ? 'bg-gray-50' : ''}`}>
      <form onSubmit={handleSubmit}>
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full overflow-hidden bg-gray-200 flex-shrink-0`}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className={`font-medium text-gray-900 ${isReply ? 'text-sm' : ''}`}>
              {user?.fullName}
            </p>
            {user?.position && (
              <p className={`text-gray-500 ${isReply ? 'text-xs' : 'text-sm'}`}>
                {user?.position}
              </p>
            )}
          </div>
        </div>

        {/* Parent author mention for replies */}
        {isReply && parentAuthorName && (
          <div className="text-sm text-blue-600 mb-2">
            Trả lời @{parentAuthorName}
          </div>
        )}

        {/* Main Content Area */}
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={isReply ? 3 : 4}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${isReply ? 'text-sm' : 'text-lg'}`}
            maxLength={maxLength}
            style={{ minHeight: isReply ? '80px' : '100px' }}
          />
        </div>

        {/* File Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 mb-4 transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-500 mb-2" />
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Kéo thả tệp vào đây hoặc{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  chọn tệp
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, PDF, DOC, XLS hoặc ZIP (tối đa 10MB mỗi tệp)
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
        </div>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Tệp đính kèm ({files.length})
            </h4>
            <div className={`grid gap-3 ${files.some(f => f.type.startsWith('image/')) ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              {files.map((file, index) => renderFilePreview(file, index))}
            </div>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-4 p-3 border rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Chọn emoji</h4>
            <div className="grid grid-cols-10 gap-2">
              {(isReply ? quickEmojis : popularEmojis).map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Thêm ảnh/video"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Ảnh</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Thêm tệp"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Tệp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              title="Thêm emoji"
            >
              <span className="text-lg">😊</span>
              <span className="text-sm font-medium">Cảm xúc</span>
            </button>

            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <span>{body.length}</span>
              <span>/</span>
              <span>{maxLength}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCollapse}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!body.trim() && files.length === 0) || body.length > maxLength}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </div>
              ) : (
                isReply ? 'Bình luận' : 'Đăng bài'
              )}
            </button>
          </div>
        </div>

        {/* Keyboard Shortcut Hint */}
        {isReply && (
          <div className="text-xs text-gray-400 mt-1">
            Nhấn Ctrl+Enter để gửi nhanh
          </div>
        )}
      </form>
    </div>
  );
}; 