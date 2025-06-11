/**
 * Consolidated formatting utilities
 */

export const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
    } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    } else if (diffInMinutes < 10080) {
        return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    } else {
        return past.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
};

export const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return 'Ngày không hợp lệ';
    }
};

// ===== COLOR UTILITIES =====

export const getStatColor = (color: string) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
        purple: 'from-purple-500 to-purple-600'
    };
    return colors[color as keyof typeof colors] || colors.blue;
};

export const getPriorityColor = (priority: string) => {
    const colors = {
        high: 'text-red-600 bg-red-100',
        HIGH: 'text-red-600 bg-red-100',
        medium: 'text-yellow-600 bg-yellow-100',
        MEDIUM: 'text-yellow-600 bg-yellow-100',
        low: 'text-green-600 bg-green-100',
        LOW: 'text-green-600 bg-green-100'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
};

export const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';

    switch (status.toLowerCase()) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-red-100 text-red-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'blocked': return 'bg-red-100 text-red-800';
        case 'deleted': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-blue-500 to-purple-600',
        'from-green-500 to-teal-600', 
        'from-yellow-500 to-orange-600',
        'from-pink-500 to-rose-600',
        'from-indigo-500 to-blue-600',
        'from-red-500 to-pink-600'
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
};

// ===== TEXT FORMATTING =====

export const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
        'NOT_STARTED': 'Chưa bắt đầu',
        'IN_PROGRESS': 'Đang tiến hành',
        'COMPLETED': 'Hoàn thành',
        'ON_HOLD': 'Tạm dừng',
        'CANCELLED': 'Đã hủy',
        'active': 'Đang hoạt động',
        'inactive': 'Không hoạt động',
        'pending': 'Chờ duyệt',
        'blocked': 'Bị khóa',
        'deleted': 'Đã xóa'
    };
    return statusMap[status] || status;
};

export const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
        'HIGH': 'Cao',
        'MEDIUM': 'Trung bình',
        'LOW': 'Thấp'
    };
    return priorityMap[priority] || priority;
};

// ===== FILE UTILITIES =====

export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎬';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('document') || file.type.includes('msword')) return '📝';
    if (file.type.includes('spreadsheet') || file.type.includes('excel')) return '📊';
    if (file.type.includes('zip') || file.type.includes('rar')) return '📦';
    return '📁';
};

// ===== REACTION UTILITIES =====

export const getReactionIcon = (type: string): string => {
    switch (type.toUpperCase()) {
        case 'LIKE': return '👍';
        case 'LOVE': return '❤️';
        case 'HAHA': return '😂';
        case 'WOW': return '😮';
        case 'SAD': return '😢';
        case 'ANGRY': return '😠';
        default: return '👍';
    }
};

export const formatReactionText = (type: string, count: number): string => {
    const reactions = {
        LIKE: 'thích',
        LOVE: 'yêu thích', 
        HAHA: 'cười',
        WOW: 'ngạc nhiên',
        SAD: 'buồn',
        ANGRY: 'tức giận'
    };
    
    return reactions[type.toUpperCase() as keyof typeof reactions] || type;
};

export const normalizeReactionCounts = (reactionCounts: any): Record<string, number> => {
    if (!reactionCounts) return {};
    
    // Handle both enum keys and string keys
    const normalized: Record<string, number> = {};
    Object.entries(reactionCounts).forEach(([key, value]) => {
        // Convert enum keys (e.g., "ReactionType.LIKE") to string keys (e.g., "LIKE")
        const normalizedKey = key.includes('.') ? key.split('.').pop() || key : key;
        normalized[normalizedKey.toUpperCase()] = Number(value) || 0;
    });
    
    return normalized;
}; 