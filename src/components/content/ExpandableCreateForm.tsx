import React, { useState, useRef } from 'react';
import { useProfileStore } from '../../stores/profile-store';
import type { ContentCreateRequest } from '../../types/content';
import {
  X, 
  Image, 
  Upload,
  FileText, 
  Loader2,
  Paperclip,
  Smile,
  Send,
  Camera,
  Plus
} from 'lucide-react';
import type { ContentTargetType } from '../../types/enums.ts';
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
  compactPlaceholder = "Chia sẻ cảm xúc của bạn ...",
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
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReply = parentId !== -1;
  const maxLength = isReply ? 1000 : 2000;
  
  // Emoji lists - Expanded with more options
  const popularEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '💪', '🚀', '✨', '👏', '🤔', '😍', '💯', '🙌', '⚡', '🎯', '💡', '🌟', '🤝', '👌'];
  const quickEmojis = ['👍', '❤️', '😂', '😊', '🎉', '🤔', '👏', '💯'];

  React.useEffect(() => {
    if (autoFocus && isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus, isExpanded]);

  // Add paste event handler
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isExpanded || !textareaRef.current?.contains(document.activeElement)) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Handle images
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
        // Handle files
        else if (item.kind === 'file') {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        setFiles(prev => [...prev, ...pastedFiles]);
        // Show a subtle notification
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1000);
      }
    };

    if (isExpanded) {
      document.addEventListener('paste', handlePaste);
    }

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [isExpanded]);

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
      
      // Reset form with animation
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
        <div key={index} className="relative group">
          <img 
            src={imageUrl} 
            alt={file.name}
            className="w-full h-32 object-cover rounded-xl shadow-sm transition-all duration-200 group-hover:shadow-md"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl" />
          <button
            type="button"
            onClick={() => removeFile(index)}
            className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200">
            {file.name}
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-xl">{getFileIcon(file)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => removeFile(index)}
          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!isExpanded) {
    // Compact Mode - Enhanced Design
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md ${isReply ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'hover:border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <div className={`${isReply ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-2 ring-white shadow-sm`}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {/* Parent author mention for replies */}
            {isReply && parentAuthorName && (
              <div className="text-sm text-blue-600 mb-2 font-medium">
                <span className="bg-blue-100 px-2 py-1 rounded-full">
                  Trả lời @{parentAuthorName}
                </span>
              </div>
            )}
            
            <button
              onClick={handleExpand}
              className="w-full text-left px-5 py-4 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 rounded-2xl text-gray-600 hover:text-gray-700 transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
            >
              <span className="font-medium">
                {isReply ? 'Viết bình luận...' : compactPlaceholder}
              </span>
            </button>
          </div>
        </div>
        
        {/* Enhanced Compact toolbar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={() => {
                handleExpand();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-xl hover:bg-blue-50"
            >
              <Image className="w-5 h-5" />
              <span className="text-sm font-medium">Ảnh</span>
            </button>
            <button
              onClick={() => {
                handleExpand();
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-200 px-3 py-2 rounded-xl hover:bg-green-50"
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-medium">Tệp</span>
            </button>
            <button
              onClick={handleExpand}
              className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-all duration-200 px-3 py-2 rounded-xl hover:bg-yellow-50"
            >
              <Smile className="w-5 h-5" />
              <span className="text-sm font-medium">Cảm xúc</span>
            </button>
          </div>
          
          <button
            onClick={handleExpand}
            className="flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-105"
          >
            <Send className="w-4 h-4" />
            <span>{isReply ? 'Bình luận' : 'Đăng bài'}</span>
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

  // Expanded Mode - Enhanced Design
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 transition-all duration-300 ${isReply ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Enhanced User Info */}
        <div className="flex items-center space-x-4">
          <div className={`${isReply ? 'w-10 h-10' : 'w-12 h-12'} rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-3 ring-white shadow-md`}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <p className={`font-semibold text-gray-900 ${isReply ? 'text-sm' : 'text-base'}`}>
              {user?.fullName}
            </p>
            {user?.position && (
              <p className={`text-gray-500 ${isReply ? 'text-xs' : 'text-sm'}`}>
                {user?.position}
              </p>
            )}
          </div>
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="ml-auto flex items-center space-x-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="text-xs font-medium">Đã dán file</span>
            </div>
          )}
        </div>

        {/* Parent author mention for replies */}
        {isReply && parentAuthorName && (
          <div className="text-sm">
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              Trả lời @{parentAuthorName}
            </span>
          </div>
        )}

        {/* Enhanced Main Content Area - Combined with Drop Zone */}
        <div 
          className={`relative border-2 border-dashed rounded-xl transition-all duration-300 ${
            dragOver 
              ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
              : 'border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-white'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${placeholder}\n\nKéo thả file vào đây hoặc dán bằng Ctrl+V`}
            rows={isReply ? 4 : 5}
            className={`w-full px-4 py-4 bg-transparent border-none rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-all duration-200 ${isReply ? 'text-sm' : 'text-base'} placeholder:text-gray-400`}
            maxLength={maxLength}
            style={{ minHeight: isReply ? '120px' : '140px' }}
          />
          
          {/* Combined Upload Hint */}
          {body.length === 0 && files.length === 0 && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-2 text-xs text-gray-400 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200">
              <Upload className="w-3 h-3" />
            </div>
          )}
          
          {/* Drag overlay */}
          {dragOver && (
            <div className="absolute inset-2 border-2 border-blue-500 border-dashed rounded-lg bg-blue-50/50 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-3">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-blue-700 font-semibold">Thả file vào đây</p>
                <p className="text-blue-600 text-sm">PNG, JPG, PDF, DOC, XLS hoặc ZIP</p>
              </div>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
          />
        </div>

        {/* Enhanced File Preview */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-gray-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                Tệp đính kèm ({files.length})
              </h4>
            </div>
            <div className={`grid gap-3 ${files.some(f => f.type.startsWith('image/')) ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
              {files.map((file, index) => renderFilePreview(file, index))}
            </div>
          </div>
        )}

        {/* Enhanced Emoji Picker */}
        {showEmojiPicker && (
          <div className="p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-white">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Smile className="w-4 h-4" />
              <span>Chọn emoji</span>
            </h4>
            <div className="grid grid-cols-10 gap-2">
              {(isReply ? quickEmojis : popularEmojis).map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-xl hover:bg-gray-200 rounded-lg p-2 transition-all duration-200 transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Toolbar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-all duration-200 p-3 rounded-xl hover:bg-blue-50"
              title="Thêm ảnh/video"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Ảnh</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-all duration-200 p-3 rounded-xl hover:bg-green-50"
              title="Thêm tệp"
            >
              <Paperclip className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Tệp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-all duration-200 p-3 rounded-xl hover:bg-yellow-50"
              title="Thêm emoji"
            >
              <Smile className="w-5 h-5" />
              <span className="text-sm font-medium hidden sm:inline">Cảm xúc</span>
            </button>

            <div className="flex items-center space-x-1 text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              <span className={body.length > maxLength * 0.8 ? 'text-orange-600 font-medium' : ''}>{body.length}</span>
              <span>/</span>
              <span>{maxLength}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleCollapse}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!body.trim() && files.length === 0) || body.length > maxLength}
              className="flex items-center space-x-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-105 disabled:transform-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isReply ? 'Bình luận' : 'Đăng bài'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Enhanced Keyboard Shortcut Hint */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          {files.length > 0 && (
            <span className="text-blue-500 font-medium">{files.length} tệp đã chọn</span>
          )}
        </div>
      </form>
    </div>
  );
}; 