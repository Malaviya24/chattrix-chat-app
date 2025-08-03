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
  encryptionKey: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsers: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
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

module.exports = mongoose.model('Room', roomSchema); 