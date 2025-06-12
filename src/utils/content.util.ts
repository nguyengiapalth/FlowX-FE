import type { ContentResponse } from '../types/content';
import type { ContentTargetType } from '../types/enums';

// Get display text for content target
export const getContentTargetDisplay = (contentTargetType: ContentTargetType, targetId: number): string => {
  switch (contentTargetType) {
    case 'GLOBAL':
      return '';
    case 'DEPARTMENT':
      return `> Phòng ban #${targetId}`;
    case 'PROJECT': 
      return `> Dự án #${targetId}`;
    default:
      return '';
  }
};

// Get subtitle display based on content subtitle
export const getSubtitleDisplay = (subtitle: string): string => {
  if (!subtitle || subtitle === 'post' || subtitle === 'reply') {
    return '';
  }
  
  // Common subtitle mappings
  const subtitleMappings: Record<string, string> = {
    'avatar_change': 'đã thay đổi ảnh đại diện',
    'cover_change': 'đã thay đổi ảnh bìa', 
    'profile_update': 'đã cập nhật thông tin cá nhân',
    'join_company': 'đã tham gia',
    'promotion': 'đã được ..',
    'birthday': 'đang sinh nhật hôm nay',
    'work_anniversary': 'kỷ niệm ngày làm việc',
    'project_join': 'đã tham gia dự án',
    'project_complete': 'đã hoàn thành dự án'
  };
  
  return subtitleMappings[subtitle] || subtitle;
};

// Format user info with subtitle and target context
export const formatContentHeader = (content: ContentResponse): {
  userInfo: string;
  targetInfo: string;
  hasSubtitle: boolean;
} => {
  const subtitleText = getSubtitleDisplay(content.subtitle);
  const targetText = getContentTargetDisplay(content.contentTargetType, content.targetId);
  
  return {
    userInfo: content.author?.fullName || 'Unknown User',
    targetInfo: targetText,
    hasSubtitle: Boolean(subtitleText)
  };
}; 