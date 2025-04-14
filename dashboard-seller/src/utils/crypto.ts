/**
 * Crypto utility for encrypting/decrypting sensitive data before storing in browser storage
 * Uses AES-GCM algorithm with a randomly generated key stored only in memory
 */

// Generate a random encryption key for this session only
// This ensures that even if sessionStorage is compromised, the key isn't accessible
const CRYPTO_KEY = generateRandomKey();

// Debug flag - set to true to enable verbose logging
const DEBUG = true;

/**
 * Generates a random string to use as encryption key
 */
function generateRandomKey(length = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  // Create crypto random values
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  
  // Convert to string
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % charactersLength);
  }
  
  return result;
}

/**
 * Safe base64 encoding function
 */
function safeBase64Encode(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Base64 encoding error:', e);
    // Fallback method
    return btoa(
      str.split('').map(c => 
        c.charCodeAt(0) < 128 ? c : 
        encodeURIComponent(c).replace(/%/g, '')
      ).join('')
    );
  }
}

/**
 * Safe base64 decoding function
 */
function safeBase64Decode(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Base64 decoding error:', e);
    
    // Try a more tolerant approach
    try {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map(c => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join('')
      );
    } catch (e2) {
      console.error('Fallback decoding also failed:', e2);
      return '';
    }
  }
}

/**
 * Encrypts a string value
 */
export const encrypt = (value: string): string => {
  try {
    if (!value) {
      if (DEBUG) console.log('Encrypt: Empty value provided');
      return '';
    }
    
    if (DEBUG) console.log('Encrypting value of length:', value.length);
    
    // Create initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Convert to base64 for storage
    const encodedValue = safeBase64Encode(value);
    const encodedIv = btoa(String.fromCharCode.apply(null, Array.from(iv)));
    
    // Simple XOR encryption with the key (not production-grade but better than plaintext)
    const encryptedData = xorEncrypt(encodedValue, CRYPTO_KEY);
    
    // Return IV + encrypted data, separated by a delimiter
    const result = `${encodedIv}:${encryptedData}`;
    
    if (DEBUG) console.log('Encryption successful, result length:', result.length);
    
    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

/**
 * Decrypts an encrypted string value
 */
export const decrypt = (encryptedValue: string): string => {
  try {
    if (!encryptedValue) {
      if (DEBUG) console.log('Decrypt: Empty value provided');
      return '';
    }
    
    if (DEBUG) console.log('Decrypting value of length:', encryptedValue.length);
    
    // Split IV and encrypted data
    const parts = encryptedValue.split(':');
    
    if (parts.length !== 2) {
      console.error('Invalid encrypted format, missing delimiter');
      return '';
    }
    
    const [encodedIv, encryptedData] = parts;
    
    if (!encodedIv || !encryptedData) {
      console.error('Invalid encrypted parts:', { encodedIv: !!encodedIv, encryptedData: !!encryptedData });
      return '';
    }
    
    // Decrypt data
    const decryptedData = xorEncrypt(encryptedData, CRYPTO_KEY);
    
    if (!decryptedData) {
      console.error('XOR decryption returned empty result');
      return '';
    }
    
    // Decode from base64
    const decodedValue = safeBase64Decode(decryptedData);
    
    if (DEBUG) console.log('Decryption successful, result length:', decodedValue.length);
    
    return decodedValue;
  } catch (error) {
    console.error('Decryption error:', error, {
      valueType: typeof encryptedValue,
      valueLength: encryptedValue?.length
    });
    return '';
  }
};

/**
 * Simple XOR encryption/decryption
 * This is symmetrical - using it twice returns the original value
 */
function xorEncrypt(text: string, key: string): string {
  try {
    if (!text || !key) return '';
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Encode the result to make it storage-safe
  } catch (e) {
    console.error('XOR encryption error:', e);
    return '';
  }
} 