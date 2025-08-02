const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  sender: {
    type: String,
    required: true
  },
  encryptedContent: {
    type: String,
    required: true
  },
  iv: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    nickname: String,
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'system', 'panic'],
    default: 'text'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  encryptionKeyRotation: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// TTL Index for auto-delete after expiration
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for efficient queries
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', messageSchema); 