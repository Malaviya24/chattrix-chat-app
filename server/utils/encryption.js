const crypto = require('crypto');

class EncryptionUtils {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
  }

  // Generate a random encryption key
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  // Generate a random IV
  generateIV() {
    return crypto.randomBytes(this.ivLength).toString('hex');
  }

  // Encrypt data with AES-GCM
  encrypt(text, key) {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipherGCM(Buffer.from(key, 'hex'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encryptedContent: encrypted,
        iv: iv.toString('hex'),
        tag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  // Decrypt data with AES-GCM
  decrypt(encryptedData, key, iv, tag) {
    try {
      const decipher = crypto.createDecipherGCM(Buffer.from(key, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  // Generate a new encryption key for key rotation
  rotateKey(oldKey) {
    return this.generateKey();
  }

  // Validate encryption key format
  validateKey(key) {
    return /^[a-fA-F0-9]{64}$/.test(key); // 32 bytes = 64 hex characters
  }

  // Create a secure random string for room IDs
  generateRoomId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Hash password with bcrypt (for server-side storage)
  async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.hash(password, 12);
  }

  // Compare password with hash
  async comparePassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return await bcrypt.compare(password, hash);
  }
}

module.exports = new EncryptionUtils(); 