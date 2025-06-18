const crypto = require('crypto');
const { configs } = require('../configs');

const ALGORITHM = 'aes-256-cbc';

// Get the encryption key from environment or use a default for development
const getEncryptionKey = () => {
  const key = configs.CODE_ENCRYPTION_KEY || 'your-32-character-ultra-secure-key!!';
  // Return the key as a buffer directly (not hashed) to match the original encryption
  return Buffer.from(key);
};

/**
 * Encrypt a piece of data
 * @param {string} text - The text to encrypt
 * @returns {object} - Object containing encrypted data and IV
 */
const encryptData = (text) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt a piece of data
 * @param {string} encryptedData - The encrypted text in hex
 * @param {string} ivHex - The initialization vector in hex
 * @returns {string} - The decrypted text
 */
const decryptData = (encryptedData, ivHex) => {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    
    // Use the same algorithm as the original encryption
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Simple encryption for backward compatibility
 * @param {string} text - The text to encrypt
 * @returns {object} - Object containing encrypted data and IV
 */
const simpleEncrypt = (text) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('Simple encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Simple decryption for backward compatibility
 * @param {string} encryptedData - The encrypted text
 * @param {string} ivHex - The initialization vector in hex
 * @returns {string} - The decrypted text
 */
const simpleDecrypt = (encryptedData, ivHex) => {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Simple decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

module.exports = {
  encryptData,
  decryptData,
  simpleEncrypt,
  simpleDecrypt
};