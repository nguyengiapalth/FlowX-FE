export interface FlowXResponse<T> {
    code: number;
    message?: string;
    data?: T;
}

// Pagination
export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}