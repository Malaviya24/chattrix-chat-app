const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  creator: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60 // Auto-delete after 24 hours (TTL Index)
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    messageExpiry: {
      type: Number,
      default: 5 * 60 * 1000 // 5 minutes in milliseconds
    },
    maxUsers: {
      type: Number,
      default: 10
    },
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    requirePassword: {
      type: Boolean,
      default: true
    }
  },
  encryptionKey: {
    type: String,
    required: true
  },
  messageCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });
roomSchema.index({ roomId: 1 });
roomSchema.index({ isActive: 1 });

module.exports = mongoose.model('Room', roomSchema); 