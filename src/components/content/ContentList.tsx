import React, { useState, useEffect } from 'react';
import type { ContentResponse } from '../../types/content';
import contentService from '../../services/content.service';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  FileIcon,
  Globe,
  ImageIcon,
  Info,
  MessageCircle,
  MoreVertical,
  Send,
  ThumbsUp
} from "lucide-react";

interface ContentListProps {
  userId?: number; // Nếu có userId thì lấy content của user đó, nếu không thì lấy global content
  showCreatePost?: boolean;
}

export const ContentList: React.FC<ContentListProps> = ({ userId, showCreatePost = false }) => {
  const [contents, setContents] = useState<ContentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let response;
        if (userId) {
          response = await contentService.getContentsByUser(userId);
        } else {
          response = await contentService.getGlobalContents();
        }
        
        if (response.code === 200 && response.data) {
          setContents(response.data);
        } else {
          setError(response.message || 'Không thể tải danh sách bài viết');
        }
      } catch (error: any) {
        console.error('Failed to fetch contents:', error);
        setError('Không thể tải danh sách bài viết');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContents();
  }, [userId]);

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: vi 
      });
    } catch {
      return 'Vừa xong';
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
    <div className="space-y-6">
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
              {/*<button className="flex items-center space-x-2 text-gray-600 hover:text-yellow-600 transition-colors">*/}
              {/*  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">*/}
              {/*    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />*/}
              {/*  </svg>*/}
              {/*  <span className="text-sm font-medium">Sự kiện</span>*/}
              {/*</button>*/}
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
          <div key={content.id} className="bg-white rounded-lg shadow-sm border">
            {/* Header */}
            <div className="p-4 pb-0">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  {content.author.avatar ? (
                    <img 
                      src={content.author.avatar} 
                      alt={content.author.fullName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold">
                      {content.author.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {content.author.fullName}
                    </h3>
                    {content.author.position && (
                      <span className="text-gray-500 text-xs">• {content.author.position}</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatTime(content.createdAt)}</span>
                    <span>•</span>
                    <Globe className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="px-4 py-3">
              <p className="text-gray-900 whitespace-pre-wrap">{content.body}</p>
            </div>

            {/* Files/Images */}
            {content.hasFile && content.files && content.files.length > 0 && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-1 gap-2">
                  {content.files.map((file) => (
                    <div key={file.id} className="border rounded-lg overflow-hidden">
                                             {file.type?.startsWith('image/') ? (
                         <img 
                           src={file.url} 
                           alt={file.name}
                           className="w-full h-auto max-h-96 object-cover"
                         />
                       ) : (
                         <div className="p-4 bg-gray-50 flex items-center space-x-3">
                           <FileIcon className="w-full h-auto max-h-96 object-cover" />
                           <div>
                             <p className="font-medium text-gray-900">{file.name}</p>
                             {file.size && (
                               <p className="text-sm text-gray-500">
                                 {(file.size / 1024 / 1024).toFixed(2)} MB
                               </p>
                             )}
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-sm font-medium">Thích</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Bình luận</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                    <Send className="w-5 h-5" />
                    <span className="text-sm font-medium">Chia sẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Replies */}
            {content.replies && content.replies.length > 0 && (
              <div className="border-t bg-gray-50 px-4 py-3">
                <div className="space-y-3">
                  {content.replies.slice(0, 3).map((reply) => (
                    <div key={reply.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                        {reply.author.avatar ? (
                          <img 
                            src={reply.author.avatar} 
                            alt={reply.author.fullName} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xs font-bold">
                            {reply.author.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-gray-900">
                            {reply.author.fullName}
                          </span>
                          <span className="text-xs text-gray-500">{formatTime(reply.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-900 mt-1">{reply.body}</p>
                      </div>
                    </div>
                  ))}
                  {content.replies.length > 3 && (
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Xem thêm {content.replies.length - 3} bình luận
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}; 