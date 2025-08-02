const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  nickname: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: true
  },
  isInvisible: {
    type: Boolean,
    default: false
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    autoHideMessages: {
      type: Boolean,
      default: false
    },
    screenshotWarning: {
      type: Boolean,
      default: true
    },
    panicModeEnabled: {
      type: Boolean,
      default: true
    }
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// TTL Index for auto-delete inactive users
userSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for efficient queries
userSchema.index({ sessionId: 1 });
userSchema.index({ roomId: 1, isActive: 1 });
userSchema.index({ lastActivity: 1 });

module.exports = mongoose.model('User', userSchema); 