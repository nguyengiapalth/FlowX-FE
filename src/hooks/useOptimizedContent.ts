import { useMemo } from 'react';
import { useContentStore } from '../stores/content-store';
import type { ContentResponse } from '../types/content';

export interface ContentFilters {
  searchTerm?: string;
  authorId?: number;
  hasFile?: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ContentSortOptions {
  sortBy: 'createdAt' | 'updatedAt' | 'replyCount' | 'author';
  sortOrder: 'asc' | 'desc';
}

export const useOptimizedContent = (filters?: ContentFilters, sortOptions?: ContentSortOptions) => {
  const { contents, isLoading, error } = useContentStore();

  // Memoized filtered contents
  const filteredContents = useMemo(() => {
    if (!filters) return contents;

    return contents.filter(content => {
      // Search term filtering
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = content.subtitle?.toLowerCase().includes(searchLower);
        const matchesBody = content.body.toLowerCase().includes(searchLower);
        const matchesAuthor = content.author.fullName.toLowerCase().includes(searchLower);
        
        if (!matchesTitle && !matchesBody && !matchesAuthor) {
          return false;
        }
      }

      // Author filtering
      if (filters.authorId && content.author.id !== filters.authorId) {
        return false;
      }

      // Files filtering
      if (filters.hasFile !== undefined && content.hasFile !== filters.hasFile) {
        return false;
      }

      // Date range filtering
      if (filters.dateRange) {
        const contentDate = new Date(content.createdAt);
        if (contentDate < filters.dateRange.startDate || contentDate > filters.dateRange.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [contents, filters]);

  // Memoized sorted contents
  const sortedContents = useMemo(() => {
    if (!sortOptions) return filteredContents;

    return [...filteredContents].sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'replyCount':
          comparison = (a.replies?.length || 0) - (b.replies?.length || 0);
          break;
        case 'author':
          comparison = a.author.fullName.localeCompare(b.author.fullName);
          break;
        default:
          return 0;
      }

      return sortOptions.sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredContents, sortOptions]);

  // Memoized content statistics
  const contentStats = useMemo(() => {
         const stats = {
       total: contents.length,
       withFiles: contents.filter(c => c.hasFile).length,
       withReplies: contents.filter(c => c.replies && c.replies.length > 0).length,
       totalReplies: contents.reduce((sum, c) => sum + (c.replies?.length || 0), 0),
       authorCount: new Set(contents.map(c => c.author.id)).size,
       recentContent: contents.filter(c => {
         const dayAgo = new Date();
         dayAgo.setDate(dayAgo.getDate() - 1);
         return new Date(c.createdAt) > dayAgo;
       }).length
     };

    return stats;
  }, [contents]);

  // Memoized trending content (based on reply count and recent activity)
  const trendingContent = useMemo(() => {
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 7); // Last 7 days

    return contents
      .filter(content => new Date(content.createdAt) > recentThreshold)
      .sort((a, b) => {
        // Score based on replies + recent activity
        const scoreA = (a.replies?.length || 0) * 2 + 
                      (new Date(a.updatedAt).getTime() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60); // hours between create and update
        const scoreB = (b.replies?.length || 0) * 2 + 
                      (new Date(b.updatedAt).getTime() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);
        
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [contents]);

  // Memoized grouped content by author
  const contentByAuthor = useMemo(() => {
    const grouped = new Map<number, {
      author: ContentResponse['author'];
      contents: ContentResponse[];
      totalReplies: number;
    }>();

    contents.forEach(content => {
      const authorId = content.author.id;
      
      if (!grouped.has(authorId)) {
        grouped.set(authorId, {
          author: content.author,
          contents: [],
          totalReplies: 0
        });
      }

      const authorData = grouped.get(authorId)!;
      authorData.contents.push(content);
      authorData.totalReplies += content.replies?.length || 0;
    });

    return Array.from(grouped.values())
      .sort((a, b) => b.contents.length - a.contents.length);
  }, [contents]);

  return {
    // Data
    contents: sortedContents,
    allContents: contents,
    filteredContents,
    
    // Statistics
    stats: contentStats,
    trendingContent,
    contentByAuthor,
    
    // State
    isLoading,
    error,
    
    // Utilities
    hasFilters: !!filters,
    resultCount: sortedContents.length,
    totalCount: contents.length
  };
}; 