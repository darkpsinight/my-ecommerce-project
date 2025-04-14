import { decrypt } from './crypto';

/**
 * Safe implementation of Base64 decoding that handles URL-safe Base64 format
 */
const safeAtob = (base64String: string): string => {
  try {
    // Convert Base64URL to regular Base64
    const normalizedBase64 = base64String
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    const paddedBase64 = normalizedBase64.padEnd(
      normalizedBase64.length + (4 - (normalizedBase64.length % 4 || 4)) % 4,
      '='
    );
    
    return atob(paddedBase64);
  } catch (error) {
    console.error('Error in safeAtob:', error);
    return '';
  }
};

/**
 * Safely parse a JWT payload without throwing exceptions
 */
const safeParseJWT = (token: string): Record<string, any> | null => {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return null;
    }

    // Split the token and get the payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null; // Not a valid JWT format (header.payload.signature)
    }

    const payload = parts[1];
    const decoded = safeAtob(payload);
    
    if (!decoded) {
      return null;
    }
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
};

/**
 * Simple utility to check if a JWT token is expired
 * This does NOT verify the signature, only checks the expiration
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    if (!token) return true;

    const parsedToken = safeParseJWT(token);
    if (!parsedToken) {
      return true; // If we can't parse the token, consider it expired
    }

    const { exp } = parsedToken;
    
    // Check if token is expired
    if (!exp) return false; // If no expiration, assume it's not expired
    const currentTime = Math.floor(Date.now() / 1000);
    return exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If there's an error, assume the token is expired
  }
};

/**
 * Check if both auth token and verify token exist and are valid
 */
export const hasValidTokens = (): boolean => {
  // Check if token exists in sessionStorage
  const encryptedToken = sessionStorage.getItem('auth_temp_token');
  const verifyToken = sessionStorage.getItem('verifyToken');
  
  if (!encryptedToken || !verifyToken) {
    return false;
  }
  
  try {
    // Decrypt access token (verifyToken is stored directly now)
    const token = decrypt(encryptedToken);
    
    // Check if tokens exist
    if (!token) {
      return false;
    }
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating tokens:', error);
    return false;
  }
}; 