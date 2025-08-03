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
    readAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  }
});

module.exports = mongoose.model('Message', messageSchema); 