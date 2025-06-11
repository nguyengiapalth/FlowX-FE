/**
 * JWT Token utilities for client-side validation
 */

export interface JWTPayload {
  sub: string; // subject (usually user ID or email)
  exp: number; // expiration time
  iat: number; // issued at
  [key: string]: any; // additional claims
}

/**
 * Decode JWT token payload without verification
 * NOTE: This only decodes, does not verify signature
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(paddedPayload);
    
    return JSON.parse(decodedPayload) as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT payload:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isJWTExpired = (token: string): boolean => {
  const payload = decodeJWTPayload(token);
  
  if (!payload || !payload.exp) {
    return true; // Consider invalid tokens as expired
  }

  const currentTime = Date.now() / 1000; // Convert to seconds
  return payload.exp < currentTime;
};

/**
 * Get token expiration time as Date object
 */
export const getJWTExpiration = (token: string): Date | null => {
  const payload = decodeJWTPayload(token);
  
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000); // Convert from seconds to milliseconds
};

/**
 * Get time until token expires in minutes
 */
export const getTimeUntilExpiration = (token: string): number | null => {
  const expirationDate = getJWTExpiration(token);
  
  if (!expirationDate) {
    return null;
  }

  const now = new Date();
  const timeDiff = expirationDate.getTime() - now.getTime();
  
  return Math.floor(timeDiff / (1000 * 60)); // Convert to minutes
};

/**
 * Extract email/subject from JWT token
 */
export const getJWTSubject = (token: string): string | null => {
  const payload = decodeJWTPayload(token);
  return payload?.sub || null;
};

/**
 * Validate JWT token format (basic validation, not cryptographic)
 */
export const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Try to decode each part
  try {
    for (const part of parts) {
      if (!part) return false;
      
      // Check if it's valid base64
      const paddedPart = part.replace(/-/g, '+').replace(/_/g, '/');
      atob(paddedPart);
    }
    
    return true;
  } catch (error) {
    return false;
  }
}; 