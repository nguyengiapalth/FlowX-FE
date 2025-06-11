import type {FileTargetType, FileVisibility, FileStatus} from './enums/enums.ts';
import type {UserResponse} from './user';

export interface FileResponse {
    id: number;
    name: string;
    type?: string;
    size?: number;
    objectKey?: string;
    contentHash?: string;
    entityId: number;
    description?: string;
    uploader: UserResponse;
    createdAt: string; // ISO datetime string
    fileTargetType: FileTargetType;
    visibility: FileVisibility;
    url?: string;
    actualSize?: number;
    fileStatus: FileStatus;
}

export interface FileCreateRequest {
    name: string;
    type?: string;
    size?: number;
    description?: string;
    targetId: number;
    fileTargetType: FileTargetType;
    visibility?: FileVisibility;
}

export interface FileUpdateRequest {
    name?: string;
    description?: string;
    visibility?: FileVisibility;
}

export interface FileUploadRequest {
    file: File;
    fileTargetType: FileTargetType;
    entityId: number;
    description?: string;
    visibility?: FileVisibility;
}

export interface PresignedUploadResponse {
    presignedFileId: number;
    url: string;
    objectKey: string;
}

export interface PresignedResponse {
    url: string;
    bucket: string;
    objectKey: string;
}

export interface BatchDeleteRequest {
    fileIds: number[];
}