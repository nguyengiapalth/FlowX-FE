import React, { useState, useRef } from 'react';
import type { ContentCreateRequest } from '../../types/content';
import type { ContentTargetType } from '../../types/enums.ts';
import { useProfileStore } from '../../stores/profile-store';
import {File, Loader2, X} from "lucide-react";

interface ReplyContentFormProps {
  contentTargetType: ContentTargetType;
  targetId: number;
  parentId: number;
  onSubmit: (request: ContentCreateRequest, files?: File[]) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  showFiles?: boolean;
  parentAuthorName?: string;
}

export const ReplyContentForm: React.FC<ReplyContentFormProps> = ({
  contentTargetType,
  targetId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = "Viết bình luận...",
  autoFocus = true,
  showFiles = true,
  parentAuthorName
}) => {
  const { user } = useProfileStore();
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compact emoji list for replies
  const quickEmojis = ['👍', '❤️', '😂', '😊', '🎉', '🤔', '👏', '💯'];

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!body.trim() && files.length === 0) return;

    setIsSubmitting(true);
    try {
      const request: ContentCreateRequest = {
        subtitle: 'reply',
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
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Failed to create reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
    setIsExpanded(true);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎬';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('document') || file.type.includes('msword')) return '📝';
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return '📊';
    return '📁';
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value);
    if (!isExpanded && e.target.value.length > 0) {
      setIsExpanded(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as never);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <form onSubmit={handleSubmit}>
        {/* User Info & Input Area */}
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            {/* Mention parent author if replying to a specific comment */}
            {parentAuthorName && parentId !== -1 && (
              <div className="text-sm text-blue-600 mb-1">
                Trả lời @{parentAuthorName}
              </div>
            )}
            
            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={isExpanded ? 3 : 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm bg-white"
              maxLength={1000}
            />
            
            {/* File Attachments */}
            {showFiles && files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileIcon(file)}</span>
                      <div>
                        <p className="text-xs font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
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
                ))}
              </div>
            )}

            {/* Quick Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-2 p-2 bg-white border rounded-lg shadow-sm">
                <div className="flex space-x-1">
                  {quickEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            {(isExpanded || body.length > 0 || files.length > 0) && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  {/* File Upload */}
                  {showFiles && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                        title="Đính kèm tệp"
                      >
                        <File className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </>
                  )}

                  {/* Emoji Picker Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-gray-500 hover:text-yellow-600 transition-colors p-1"
                    title="Thêm emoji"
                  >
                    <span className="text-sm">😊</span>
                  </button>

                  {/* Character Count */}
                  <div className="text-xs text-gray-400">
                    {body.length}/1000
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors"
                      disabled={isSubmitting}
                    >
                      Hủy
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || (!body.trim() && files.length === 0) || body.length > 1000}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-1">
                        <Loader2 className="animate-spin w-4 h-4" />
                        <span>Đang gửi...</span>
                      </div>
                    ) : (
                      'Bình luận'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcut Hint */}
            {isExpanded && (
              <div className="text-xs text-gray-400 mt-1">
                Nhấn Ctrl+Enter để gửi nhanh
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}; 