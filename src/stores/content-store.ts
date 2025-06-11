import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentResponse, ContentCreateRequest, ContentUpdateRequest, ContentReactionSummary } from '../types/content';
import { normalizeReactionCounts } from '../types/content';
import type { ContentTargetType } from '../types/enums/enums';
import { useAuthStore } from './auth-store';
import contentService from '../services/content.service';
import contentReactionService from '../services/contentReaction.service';

interface ContentState {
    // State
    contents: ContentResponse[];
    currentContent: ContentResponse | null;
    isLoading: boolean;
    error: string | null;
    
    // Reaction state
    reactionSummaries: Record<number, ContentReactionSummary>;
    reactionLoading: Record<number, boolean>;
    
    // Actions
    setContents: (contents: ContentResponse[]) => void;
    setCurrentContent: (content: ContentResponse | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Data fetching
    fetchAllContents: () => Promise<void>;
    fetchContentById: (id: number) => Promise<void>;
    fetchContentsByTarget: (contentTargetType: ContentTargetType, targetId: number) => Promise<void>;
    fetchContentsByParent: (parentId: number) => Promise<void>;
    
    // CRUD operations
    createContent: (request: ContentCreateRequest) => Promise<ContentResponse>;
    updateContent: (id: number, request: ContentUpdateRequest) => Promise<ContentResponse>;
    deleteContent: (id: number) => Promise<void>;
    syncContentFiles: (id: number) => Promise<void>;
    
    // Reaction operations
    fetchReactionSummary: (contentId: number) => Promise<void>;
    addOrUpdateReaction: (contentId: number, reactionType: string) => Promise<void>;
    removeReaction: (contentId: number) => Promise<void>;
    setReactionSummary: (contentId: number, summary: ContentReactionSummary) => void;
    setReactionLoading: (contentId: number, loading: boolean) => void;
    
    // Utility
    addContent: (content: ContentResponse) => void;
    updateContentInList: (updatedContent: ContentResponse) => void;
    removeContent: (id: number) => void;
    addReplyToContent: (parentId: number, reply: ContentResponse) => void;
    removeReplyFromContent: (parentId: number, replyId: number) => void;
    
    // Processing helpers
    processContentsWithReplies: (allContents: ContentResponse[]) => ContentResponse[];
    clearContents: () => void;
}

export const useContentStore = create<ContentState>()(
    persist(
        (set, get) => ({
            // Initial state
            contents: [],
            currentContent: null,
            isLoading: false,
            error: null,
            
            // Reaction state
            reactionSummaries: {},
            reactionLoading: {},

            // Actions
            setContents: (contents) => {
                set({ contents, error: null });
            },

            setCurrentContent: (content) => {
                set({ currentContent: content, error: null });
            },

            setLoading: (loading) => {
                set({ isLoading: loading });
            },

            setError: (error) => {
                set({ error });
            },

            // Data fetching
            fetchAllContents: async () => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.getGlobalContents()
                    
                    if (response.code === 200 && response.data) {
                        const processedContents = get().processContentsWithReplies(response.data);
                        set({ contents: processedContents, isLoading: false });
                    } else {
                        set({ contents: [], isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch contents';
                    set({ error: errorMessage, isLoading: false, contents: [] });
                }
            },

            fetchContentById: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.getContentById(id);
                    
                    if (response.code === 200 && response.data) {
                        set({ currentContent: response.data, isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch content';
                    set({ error: errorMessage, isLoading: false });
                }
            },

            fetchContentsByTarget: async (contentTargetType: ContentTargetType, targetId: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.getContentsByTarget(contentTargetType, targetId);
                    
                    if (response.code === 200 && response.data) {
                        const processedContents = get().processContentsWithReplies(response.data);
                        set({ contents: processedContents, isLoading: false });
                    } else {
                        set({ contents: [], isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch target contents';
                    set({ error: errorMessage, isLoading: false, contents: [] });
                }
            },

            fetchContentsByParent: async (parentId: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    return;
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.getContentsByParent(parentId);
                    
                    if (response.code === 200 && response.data) {
                        set({ contents: response.data, isLoading: false });
                    } else {
                        set({ contents: [], isLoading: false });
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch replies';
                    set({ error: errorMessage, isLoading: false, contents: [] });
                }
            },

            // CRUD operations
            createContent: async (request: ContentCreateRequest) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.createContent(request);
                    
                    if (response.code === 200 && response.data) {
                        const newContent = { ...response.data, replies: [] };
                        
                        if (request.parentId && request.parentId !== -1) {
                            // This is a reply, add to parent's replies
                            get().addReplyToContent(request.parentId, newContent);
                        } else {
                            // This is a root content
                            set((state) => ({
                                contents: [newContent, ...state.contents],
                                isLoading: false
                            }));
                        }
                        
                        set({ isLoading: false });
                        return newContent;
                    }
                    throw new Error(response.message || 'Failed to create content');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to create content';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            updateContent: async (id: number, request: ContentUpdateRequest) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.updateContent(id, request);
                    
                    if (response.code === 200 && response.data) {
                        const updatedContent = response.data;
                        get().updateContentInList(updatedContent);
                        set({ isLoading: false });
                        return updatedContent;
                    }
                    throw new Error(response.message || 'Failed to update content');
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to update content';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            deleteContent: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    set({ isLoading: true, error: null });
                    
                    const response = await contentService.deleteContent(id);
                    
                    if (response.code === 200) {
                        get().removeContent(id);
                        set({ isLoading: false });
                    } else {
                        throw new Error(response.message || 'Failed to delete content');
                    }
                } catch (error: any) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete content';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            syncContentFiles: async (id: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    set({ error: 'No access token' });
                    throw new Error('No access token');
                }

                try {
                    const response = await contentService.syncContentFiles(id);
                    
                    if (response.code === 200 && response.data) {
                        get().updateContentInList(response.data);
                    }
                } catch (error: any) {
                    console.warn('Failed to sync content files:', error);
                    // Don't throw error for sync operation
                }
            },

            // Utility
            addContent: (content) => {
                set((state) => ({
                    contents: [content, ...state.contents]
                }));
            },

            updateContentInList: (updatedContent) => {
                set((state) => ({
                    contents: state.contents.map(content => {
                        if (content.id === updatedContent.id) {
                            return updatedContent;
                        }
                        // Update in replies too
                        if (content.replies && content.replies.length > 0) {
                            return {
                                ...content,
                                replies: content.replies.map(reply => 
                                    reply.id === updatedContent.id ? updatedContent : reply
                                )
                            };
                        }
                        return content;
                    }),
                    currentContent: state.currentContent?.id === updatedContent.id ? updatedContent : state.currentContent
                }));
            },

            removeContent: (id) => {
                set((state) => ({
                    contents: state.contents.map(content => {
                        if (content.id === id) {
                            return null; // Mark for removal
                        }
                        // Remove from replies too
                        if (content.replies && content.replies.length > 0) {
                            return {
                                ...content,
                                replies: content.replies.filter(reply => reply.id !== id)
                            };
                        }
                        return content;
                    }).filter(Boolean) as ContentResponse[], // Remove nulls
                    currentContent: state.currentContent?.id === id ? null : state.currentContent
                }));
            },

            addReplyToContent: (parentId, reply) => {
                set((state) => ({
                    contents: state.contents.map(content => 
                        content.id === parentId 
                            ? { ...content, replies: [...(content.replies || []), reply] }
                            : content
                    )
                }));
            },

            removeReplyFromContent: (parentId, replyId) => {
                set((state) => ({
                    contents: state.contents.map(content => 
                        content.id === parentId 
                            ? { 
                                ...content, 
                                replies: (content.replies || []).filter(reply => reply.id !== replyId) 
                              }
                            : content
                    )
                }));
            },

            // Processing helpers
            processContentsWithReplies: (allContents: ContentResponse[]) => {
                // Separate root contents and replies
                const posts = allContents.filter(content => content.parentId === -1);
                const comments = allContents.filter(content => content.parentId !== -1);
                
                // Attach comments to their parent posts
                const postsWithComments = posts.map(post => ({
                    ...post,
                    replies: comments.filter(comment => comment.parentId === post.id)
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                }));
                
                // Sort posts by creation time (newest first)
                return postsWithComments.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            },

            // Reaction operations
            fetchReactionSummary: async (contentId: number) => {
                try {
                    const response = await contentReactionService.getReactionSummary(contentId);
                    if (response.code === 200 && response.data) {
                        // Normalize the reaction counts from backend format
                        const normalizedSummary = {
                            ...response.data,
                            reactionCounts: normalizeReactionCounts(response.data.reactionCounts)
                        };
                        get().setReactionSummary(contentId, normalizedSummary);
                    }
                } catch (error: any) {
                    console.warn('Failed to fetch reaction summary:', error);
                }
            },

            addOrUpdateReaction: async (contentId: number, reactionType: string) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    throw new Error('No access token');
                }

                try {
                    get().setReactionLoading(contentId, true);
                    
                    const response = await contentReactionService.addOrUpdateReaction({
                        contentId,
                        reactionType: reactionType as any
                    });

                    if (response.code === 200) {
                        // Refresh reaction summary after successful reaction
                        await get().fetchReactionSummary(contentId);
                    }
                } catch (error: any) {
                    console.error('Failed to add/update reaction:', error);
                    throw error;
                } finally {
                    get().setReactionLoading(contentId, false);
                }
            },

            removeReaction: async (contentId: number) => {
                const { accessToken } = useAuthStore.getState();
                if (!accessToken) {
                    throw new Error('No access token');
                }

                try {
                    get().setReactionLoading(contentId, true);
                    
                    const response = await contentReactionService.removeReaction(contentId);

                    if (response.code === 200) {
                        // Refresh reaction summary after successful removal
                        await get().fetchReactionSummary(contentId);
                    }
                } catch (error: any) {
                    console.error('Failed to remove reaction:', error);
                    throw error;
                } finally {
                    get().setReactionLoading(contentId, false);
                }
            },

            setReactionSummary: (contentId: number, summary: ContentReactionSummary) => {
                set((state) => ({
                    reactionSummaries: {
                        ...state.reactionSummaries,
                        [contentId]: summary
                    }
                }));
            },

            setReactionLoading: (contentId: number, loading: boolean) => {
                set((state) => ({
                    reactionLoading: {
                        ...state.reactionLoading,
                        [contentId]: loading
                    }
                }));
            },

            clearContents: () => {
                set({ 
                    contents: [], 
                    currentContent: null, 
                    error: null, 
                    isLoading: false,
                    reactionSummaries: {},
                    reactionLoading: {}
                });
            }
        }),
        {
            name: 'content-storage',
            partialize: (state) => ({ 
                contents: state.contents
            }),
        }
    )
); 