/**
 * Cookie utilities for client-side cookie management
 */

export const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const part = parts.pop();
        return part ? part.split(';').shift() || null : null;
    }
    return null;
};

export const setCookie = (
    name: string, 
    value: string, 
    options: {
        days?: number;
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
    } = {}
): void => {
    let cookieString = `${name}=${value}`;
    
    if (options.days) {
        const date = new Date();
        date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000));
        cookieString += `; expires=${date.toUTCString()}`;
    }
    
    if (options.path) {
        cookieString += `; path=${options.path}`;
    }
    
    if (options.domain) {
        cookieString += `; domain=${options.domain}`;
    }
    
    if (options.secure) {
        cookieString += `; secure`;
    }
    
    if (options.sameSite) {
        cookieString += `; samesite=${options.sameSite}`;
    }
    
    document.cookie = cookieString;
};

export const deleteCookie = (name: string, path?: string): void => {
    setCookie(name, '', { days: -1, path });
};

export const hasRefreshToken = (): boolean => {
    return getCookie('refreshToken') !== null;
}; 