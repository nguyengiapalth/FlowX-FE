import type {ContentTargetType} from './enums/enums.ts';
import type {FileResponse} from './file';
import type {UserResponse} from './user';



// Updated ContentResponse to match backend
export interface ContentResponse {
    id: number;
    subtitle: string;
    body: string;
    author: UserResponse;
    contentTargetType: ContentTargetType;
    targetId: number;
    parentId: number;
    depth: number;
    createdAt: string; // ISO datetime string
    updatedAt: string; // ISO datetime string
    replies: ContentResponse[];
    hasFile: boolean;
    files: FileResponse[];
}



export interface ContentCreateRequest {
    subtitle: string; // Optional subtitle
    body: string;
    contentTargetType: ContentTargetType;
    targetId: number;
    parentId?: number; // -1 means no parent (root content)
}

export interface ContentUpdateRequest {
    body?: string;
    attachments?: File[];
}

export interface ContentReactionRequest {
    contentId: number;
    reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
}

export interface ContentReactionResponse {
    id: number;
    contentId: number;
    user: UserResponse;
    reactionType: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
    createdAt: string;
    updatedAt: string;
}

export interface ContentReactionSummary {
    contentId: number;
    totalReactions: number;
    reactionCounts: Record<string, number>;
    userReaction: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY' | null;
}

// Re-export utility functions from format.util.ts for backward compatibility
export { normalizeReactionCounts, getReactionIcon, formatReactionText } from '../utils/format.util';