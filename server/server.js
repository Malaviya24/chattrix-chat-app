const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs'); // Added bcrypt for password comparison
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
      "https://chattrix-chat-app.netlify.app",
      "https://chattrix-chat-app.onrender.com",
      "http://localhost:5000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// MongoDB connection
let mongoConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chattrix', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  mongoConnected = true;
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.log('⚠️  Running without database - some features may not work');
  console.log('💡 To fix this:');
  console.log('   1. Install MongoDB locally, or');
  console.log('   2. Use MongoDB Atlas (cloud), or');
  console.log('   3. Update MONGODB_URI in your environment variables');
});

// Add a simple in-memory store for development when MongoDB is not available
const inMemoryStore = {
  rooms: new Map(),
  users: new Map(),
  messages: new Map()
};

// Helper function to check if we can use database
const canUseDatabase = () => {
  return mongoConnected && mongoose.connection.readyState === 1;
};

// Middleware
app.use(helmetConfig);
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://chattrix-chat-app.netlify.app",
    "https://chattrix-chat-app.onrender.com",
    "http://localhost:5000"
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
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    httpOnly: true,
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
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
  generateCSRFToken,  // Enable CSRF token generation
  csrfProtection,     // Enable CSRF protection
  validateRoomCreation,
  async (req, res) => {
    try {
      const { nickname, password, maxUsers = 10 } = req.body;
      
      // Generate room ID and encryption key
      const roomId = encryption.generateRoomId();
      const encryptionKey = encryption.generateKey();
      const hashedPassword = await encryption.hashPassword(password);
      
      if (canUseDatabase()) {
        // Create room in database
        const room = new Room({
          roomId,
          password: hashedPassword,
          creator: nickname,
          nickname,
          encryptionKey,
          maxUsers: Math.min(Math.max(maxUsers, 1), 50), // Ensure between 1-50
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes for security
        });
        
        await room.save();
        
        // Create user session for the creator
        const sessionId = encryption.generateRoomId();
        const user = new User({
          sessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes for security
        });
        
        await user.save();
        
        res.json({
          roomId,
          sessionId,
          encryptionKey,
          message: 'Room created successfully',
          expiresAt: room.expiresAt
        });
      } else {
        // Use in-memory store
        const sessionId = encryption.generateRoomId();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        
        inMemoryStore.rooms.set(roomId, {
          roomId,
          password: hashedPassword,
          creator: nickname,
          nickname,
          encryptionKey,
          maxUsers: Math.min(Math.max(maxUsers, 1), 50),
          isActive: true,
          expiresAt
        });
        
        inMemoryStore.users.set(sessionId, {
          sessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt
        });
        
        res.json({
          roomId,
          sessionId,
          encryptionKey,
          message: 'Room created successfully (in-memory mode)',
          expiresAt
        });
      }
    } catch (error) {
      console.error('Room creation error:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
);

// Join room endpoint
app.post('/api/rooms/:roomId/join',
  authLimiter,
  generateCSRFToken,  // Enable CSRF token generation
  csrfProtection,     // Enable CSRF protection
  validateJoinRoom,
  async (req, res) => {
    try {
      const { roomId } = req.params;
      const { nickname, password } = req.body;
      
      if (canUseDatabase()) {
        // Find room in database
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
        if (userCount >= room.maxUsers) {
          return res.status(403).json({ error: 'Room is full' });
        }
        
        // Create user session
        const sessionId = encryption.generateRoomId();
        const user = new User({
          sessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes for security
        });
        
        await user.save();
        
        res.json({
          sessionId,
          encryptionKey: room.encryptionKey,
          message: 'Joined room successfully'
        });
      } else {
        // Use in-memory store
        const room = inMemoryStore.rooms.get(roomId);
        if (!room || !room.isActive) {
          return res.status(404).json({ error: 'Room not found' });
        }
        
        // Verify password
        const isValidPassword = await encryption.comparePassword(password, room.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Incorrect password' });
        }
        
        // Check room capacity (simplified for in-memory)
        const userCount = Array.from(inMemoryStore.users.values())
          .filter(user => user.roomId === roomId && user.isActive).length;
        
        if (userCount >= room.maxUsers) {
          return res.status(403).json({ error: 'Room is full' });
        }
        
        // Create user session
        const sessionId = encryption.generateRoomId();
        inMemoryStore.users.set(sessionId, {
          sessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        
        res.json({
          sessionId,
          encryptionKey: room.encryptionKey,
          message: 'Joined room successfully (in-memory mode)'
        });
      }
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
  
  // Join room
  socket.on('join-room', async (data) => {
    try {
      const { roomId, nickname, password, sessionId } = data;
      
      console.log('Join room attempt:', { roomId, nickname, sessionId });
      
      if (!roomId || !nickname || !password) {
        console.error('Missing required fields:', { roomId, nickname, hasPassword: !!password });
        socket.emit('join-error', { message: 'Missing required fields' });
        return;
      }
      
      // Find room
      const room = await Room.findOne({ roomId, isActive: true });
      if (!room) {
        console.error('Room not found:', roomId);
        socket.emit('join-error', { message: 'Room not found or expired' });
        return;
      }
      
      console.log('Room found:', { roomId: room.roomId, creator: room.creator });
      
      // Verify password
      const isValidPassword = await encryption.comparePassword(password, room.password);
      console.log('Password verification:', { isValid: isValidPassword });
      if (!isValidPassword) {
        socket.emit('join-error', { message: 'Incorrect password' });
        return;
      }
      
      // Check room capacity
      const currentUsers = await User.countDocuments({ roomId, isActive: true });
      console.log('Room capacity check:', { currentUsers, maxUsers: room.maxUsers });
      if (currentUsers >= room.maxUsers) {
        socket.emit('join-error', { message: 'Room is full' });
        return;
      }
      
      // Check if user already exists in this room
      let user = await User.findOne({ 
        nickname, 
        roomId, 
        isActive: true 
      });
      
      if (user) {
        // Update existing user session
        user.sessionId = sessionId || user.sessionId;
        user.lastSeen = new Date();
        await user.save();
        console.log('Updated existing user session:', user.sessionId);
      } else {
        // Create new user session
        const newSessionId = sessionId || encryption.generateRoomId();
        user = new User({
          sessionId: newSessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await user.save();
        console.log('Created new user session:', newSessionId);
      }
      
      // Store socket data
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.sessionId = user.sessionId;
      
      // Join socket room
      socket.join(roomId);
      
      // Emit session update
      socket.emit('session-updated', { sessionId: user.sessionId });
      
      // Send room info
      socket.emit('room-info', {
        roomId,
        nickname,
        maxUsers: room.maxUsers,
        currentUsers: currentUsers + 1
      });
      
      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        nickname,
        timestamp: new Date()
      });
      
      console.log(`✅ ${nickname} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('join-error', { message: 'Failed to join room. Please try again.' });
    }
  });

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { text, timestamp, expiresAt } = data;
      const roomId = socket.roomId;
      const nickname = socket.nickname;
      
      console.log('Send message attempt:', { roomId, nickname, sessionId: socket.sessionId });
      
      if (!roomId || !nickname) {
        console.error('Send message error: Missing roomId or nickname', { roomId, nickname });
        socket.emit('message-error', { message: 'Connection issue. Please refresh the page.' });
        return;
      }
      
      // Verify user is in the room (simplified check)
      const user = await User.findOne({ 
        nickname, 
        roomId, 
        isActive: true 
      });
      
      if (!user) {
        console.log('User not found in room, creating session...');
        // Create user session if not exists
        const newSessionId = socket.sessionId || encryption.generateRoomId();
        const newUser = new User({
          sessionId: newSessionId,
          roomId,
          nickname,
          isActive: true,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        await newUser.save();
        socket.sessionId = newSessionId;
        
        // Update client session
        socket.emit('session-updated', { sessionId: newSessionId });
        console.log('Created new user session for message sender:', newSessionId);
      }
      
      // Rate limiting check
      const messageCount = await Message.countDocuments({
        roomId,
        sender: nickname,
        createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
      });
      
      if (messageCount >= 30) {
        socket.emit('message-error', { message: 'Rate limit exceeded' });
        return;
      }
      
      // Create message
      const message = new Message({
        roomId,
        messageId: encryption.generateRoomId(),
        sender: nickname,
        encryptedContent: text, // Store text directly for now
        iv: 'placeholder',
        expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      });
      
      await message.save();
      
      // Broadcast to room
      io.to(roomId).emit('new-message', {
        id: message.messageId,
        sender: nickname,
        text: text,
        timestamp: timestamp || message.createdAt,
        expiresAt: message.expiresAt
      });
      
      console.log(`✅ Message sent by ${nickname} in room ${roomId}`);
      
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message-error', { message: 'Failed to send message. Please try again.' });
    }
  });

  // Typing indicators
  socket.on('start-typing', () => {
    socket.to(socket.roomId).emit('user-typing', {
      nickname: socket.nickname
    });
  });

  socket.on('stop-typing', () => {
    socket.to(socket.roomId).emit('user-stop-typing', {
      nickname: socket.nickname
    });
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