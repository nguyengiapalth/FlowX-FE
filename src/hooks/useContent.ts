import { useEffect } from 'react';
import { useContentStore } from '../stores/content-store';
import type { ContentTargetType } from '../types/enums';

// Hook for global contents (newsfeed)
export const useGlobalContents = () => {
  const {
    contents,
    isLoading,
    error,
    fetchAllContents,
    createContent,
    deleteContent,
    updateContent
  } = useContentStore();

  useEffect(() => {
    fetchAllContents();
  }, [fetchAllContents]);

  return {
    contents,
    isLoading,
    error,
    refreshContents: fetchAllContents,
    createContent,
    deleteContent,
    updateContent
  };
};

// Hook for all contents from all sources (newsfeed with everything)
export const useAllContents = () => {
  const {
    contents,
    isLoading,
    error,
    fetchAllContentsFromAllSources,
    createContent,
    deleteContent,
    updateContent
  } = useContentStore();

  useEffect(() => {
    fetchAllContentsFromAllSources();
  }, [fetchAllContentsFromAllSources]);

  return {
    contents,
    isLoading,
    error,
    refreshContents: fetchAllContentsFromAllSources,
    createContent,
    deleteContent,
    updateContent
  };
};

// Hook for contents by target (project, department)
export const useTargetContents = (contentTargetType: ContentTargetType, targetId: number) => {
  const {
    contents,
    isLoading,
    error,
    fetchContentsByTarget,
    createContent,
    deleteContent,
    updateContent
  } = useContentStore();

  useEffect(() => {
    if (targetId && contentTargetType) {
      fetchContentsByTarget(contentTargetType, targetId);
    }
  }, [fetchContentsByTarget, contentTargetType, targetId]);

  const refreshContents = () => {
    if (targetId && contentTargetType) {
      fetchContentsByTarget(contentTargetType, targetId);
    }
  };

  return {
    contents,
    isLoading,
    error,
    refreshContents,
    createContent,
    deleteContent,
    updateContent
  };
};

// Hook for contents by user
export const useUserContents = (userId: number) => {
  const {
    contents,
    isLoading,
    error,
    fetchContentsByUser,
    createContent,
    deleteContent,
    updateContent
  } = useContentStore();

  useEffect(() => {
    if (userId) {
      fetchContentsByUser(userId);
    }
  }, [fetchContentsByUser, userId]);

  const refreshContents = () => {
    if (userId) {
      fetchContentsByUser(userId);
    }
  };

  return {
    contents,
    isLoading,
    error,
    refreshContents,
    createContent,
    deleteContent,
    updateContent
  };
};

// Hook for single content (details)
export const useContentById = (contentId: number) => {
  const {
    currentContent,
    isLoading,
    error,
    fetchContentById,
    updateContent,
    deleteContent
  } = useContentStore();

  useEffect(() => {
    if (contentId) {
      fetchContentById(contentId);
    }
  }, [fetchContentById, contentId]);

  const refreshContent = () => {
    if (contentId) {
      fetchContentById(contentId);
    }
  };

  return {
    content: currentContent,
    isLoading,
    error,
    refreshContent,
    updateContent,
    deleteContent
  };
};

// Hook for reactions
export const useContentReactions = () => {
  const {
    reactionSummaries,
    reactionLoading,
    fetchReactionSummary,
    addOrUpdateReaction,
    removeReaction
  } = useContentStore();

  return {
    reactionSummaries,
    reactionLoading,
    fetchReactionSummary,
    addOrUpdateReaction,
    removeReaction
  };
}; 