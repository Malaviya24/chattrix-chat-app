const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Import models
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');

// Import utilities
const encryption = require('./utils/encryption');

// Import middleware
const {
  authLimiter,
  messageLimiter,
  roomCreationLimiter,
  sanitizeInput,
  csrfProtection,
  generateCSRFToken,
  validateRoomCreation,
  validateJoinRoom,
  sessionSecurity,
  helmetConfig
} = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "https://chattrix-chat-app.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chattrix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(helmetConfig);
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://chattrix-chat-app.netlify.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/chattrix',
    ttl: 24 * 60 * 60 // 24 hours
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(sessionSecurity);
app.use(sanitizeInput);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Chat server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Generate CSRF token
app.get('/api/csrf-token', generateCSRFToken, (req, res) => {
  res.json({ csrfToken: req.session.csrfToken });
});

// Create room endpoint
app.post('/api/rooms', 
  roomCreationLimiter,
  generateCSRFToken,
  csrfProtection,
  validateRoomCreation,
  async (req, res) => {
    try {
      const { nickname, password } = req.body;
      
      // Generate room ID and encryption key
      const roomId = encryption.generateRoomId();
      const encryptionKey = encryption.generateKey();
      const hashedPassword = await encryption.hashPassword(password);
      
      // Create room
      const room = new Room({
        roomId,
        password: hashedPassword,
        creator: nickname,
        nickname,
        encryptionKey,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      await room.save();
      
      res.json({
        roomId,
        encryptionKey,
        message: 'Room created successfully',
        expiresAt: room.expiresAt
      });
    } catch (error) {
      console.error('Room creation error:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
);

// Join room endpoint
app.post('/api/rooms/:roomId/join',
  authLimiter,
  generateCSRFToken,
  csrfProtection,
  validateJoinRoom,
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { nickname, password } = req.body;
      
      // Find room
      const room = await Room.findOne({ roomId, isActive: true });
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      // Verify password
      const isValidPassword = await encryption.comparePassword(password, room.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
      
      // Check room capacity
      const userCount = await User.countDocuments({ roomId, isActive: true });
      if (userCount >= room.settings.maxUsers) {
        return res.status(403).json({ error: 'Room is full' });
      }
      
      // Create user session
      const sessionId = encryption.generateRoomId();
      const user = new User({
        sessionId,
        roomId,
        nickname,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      await user.save();
      
      res.json({
        user: {
          sessionId,
          nickname,
          roomId
        },
        encryptionKey: room.encryptionKey,
        message: 'Joined room successfully'
      });
    } catch (error) {
      console.error('Join room error:', error);
      res.status(500).json({ error: 'Failed to join room' });
    }
  }
);

// Get room info
app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId, isActive: true });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const userCount = await User.countDocuments({ roomId, isActive: true });
    
    res.json({
      roomId: room.roomId,
      creator: room.creator,
      createdAt: room.createdAt,
      userCount,
      settings: room.settings
    });
  } catch (error) {
    console.error('Get room info error:', error);
    res.status(500).json({ error: 'Failed to get room info' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  // Join room via Socket.IO
  socket.on('join-room', async (data) => {
    try {
      const { roomId, nickname, password, sessionId } = data;
      
      // Verify room exists
      const room = await Room.findOne({ roomId, isActive: true });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      
      // Verify password
      const isValidPassword = await encryption.comparePassword(password, room.password);
      if (!isValidPassword) {
        socket.emit('error', { message: 'Incorrect password' });
        return;
      }
      
      // Verify user session
      const user = await User.findOne({ sessionId, roomId, isActive: true });
      if (!user) {
        socket.emit('error', { message: 'Invalid session' });
        return;
      }
      
      // Join socket room
      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.sessionId = sessionId;
      
      // Update user activity
      await User.findByIdAndUpdate(user._id, { 
        lastActivity: new Date(),
        isActive: true
      });
      
      // Notify others
      socket.to(roomId).emit('user-joined', {
        user: { nickname },
        message: `${nickname} joined the room`
      });
      
      // Send room info and recent messages
      const recentMessages = await Message.find({ 
        roomId, 
        isVisible: true 
      })
      .sort({ createdAt: -1 })
      .limit(50);
      
      socket.emit('room-info', {
        roomId,
        users: await User.find({ roomId, isActive: true }).select('nickname'),
        messages: recentMessages.reverse(),
        encryptionKey: room.encryptionKey
      });
      
    } catch (error) {
      console.error('Socket join room error:', error);
      socket.emit('error', { message: 'Server error' });
    }
  });
  
  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { text, encryptedContent, iv, tag } = data;
      const roomId = socket.roomId;
      const nickname = socket.nickname;
      
      if (!roomId || !nickname) {
        socket.emit('error', { message: 'Not in a room' });
        return;
      }
      
      // Rate limiting check
      const messageCount = await Message.countDocuments({
        roomId,
        sender: nickname,
        createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
      });
      
      if (messageCount >= 30) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      
      // Create message
      const message = new Message({
        roomId,
        messageId: encryption.generateRoomId(),
        sender: nickname,
        encryptedContent,
        iv,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });
      
      await message.save();
      
      // Broadcast to room
      io.to(roomId).emit('new-message', {
        id: message.messageId,
        sender: nickname,
        encryptedContent,
        iv,
        timestamp: message.createdAt,
        expiresAt: message.expiresAt
      });
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Mark message as read
  socket.on('mark-read', async (data) => {
    try {
      const { messageId } = data;
      const nickname = socket.nickname;
      
      await Message.findOneAndUpdate(
        { messageId },
        { 
          $push: { 
            readBy: { 
              nickname, 
              readAt: new Date() 
            } 
          },
          $set: { isRead: true }
        }
      );
      
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
  
  // Toggle invisible mode
  socket.on('toggle-invisible', async (data) => {
    try {
      const { isInvisible } = data;
      const sessionId = socket.sessionId;
      
      await User.findOneAndUpdate(
        { sessionId },
        { isInvisible }
      );
      
      socket.to(socket.roomId).emit('user-invisible', {
        nickname: socket.nickname,
        isInvisible
      });
      
    } catch (error) {
      console.error('Toggle invisible error:', error);
    }
  });
  
  // Panic mode
  socket.on('panic-mode', async () => {
    try {
      const roomId = socket.roomId;
      
      // Clear all messages in room
      await Message.deleteMany({ roomId });
      
      // Notify all users in room
      io.to(roomId).emit('panic-mode', {
        message: 'All messages have been cleared due to panic mode'
      });
      
    } catch (error) {
      console.error('Panic mode error:', error);
    }
  });
  
  // Disconnect
  socket.on('disconnect', async () => {
    console.log('🔌 User disconnected:', socket.id);
    
    if (socket.sessionId) {
      try {
        await User.findOneAndUpdate(
          { sessionId: socket.sessionId },
          { isActive: false }
        );
        
        socket.to(socket.roomId).emit('user-left', {
          user: { nickname: socket.nickname },
          message: `${socket.nickname} left the room`
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    }
  });
});

// Clean up expired data every 5 minutes
setInterval(async () => {
  try {
    const now = new Date();
    
    // Clean up expired messages
    await Message.deleteMany({ expiresAt: { $lt: now } });
    
    // Clean up inactive users
    await User.deleteMany({ expiresAt: { $lt: now } });
    
    // Clean up expired rooms
    await Room.deleteMany({ expiresAt: { $lt: now } });
    
    console.log('🧹 Cleaned up expired data');
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🔐 AES-GCM encryption enabled`);
  console.log(`⏰ Message expiration: 5 minutes`);
  console.log(`🛡️ Security features: CSRF, Rate limiting, Input sanitization`);
  console.log(`🗄️ MongoDB with TTL indexes for auto-cleanup`);
  console.log(`🌐 CORS enabled for frontend`);
}); 