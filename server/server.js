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
      "https://chattrix-chat-app.windsurf.build",
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
    "https://chattrix-chat-app.windsurf.build",
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
  // generateCSRFToken,  // Temporarily disabled CSRF token generation
  // csrfProtection,     // Temporarily disabled CSRF protection
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
  // generateCSRFToken,  // Temporarily disabled CSRF token generation
  // csrfProtection,     // Temporarily disabled CSRF protection
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
        
        // Check if room has expired
        if (room.expiresAt && new Date() > room.expiresAt) {
          // Mark room as inactive and return error
          await Room.findOneAndUpdate({ roomId }, { isActive: false });
          return res.status(410).json({ error: 'Room link has expired. Please create a new room.' });
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
        
        // Check if room has expired
        if (room.expiresAt && new Date() > room.expiresAt) {
          // Mark room as inactive and return error
          room.isActive = false;
          return res.status(410).json({ error: 'Room link has expired. Please create a new room.' });
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
      
      let room;
      if (canUseDatabase()) {
        // Find room in database
        room = await Room.findOne({ roomId, isActive: true });
      } else {
        // Use in-memory store
        room = inMemoryStore.rooms.get(roomId);
      }
      
      if (!room || !room.isActive) {
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
      let currentUsers;
      if (canUseDatabase()) {
        currentUsers = await User.countDocuments({ roomId, isActive: true });
      } else {
        currentUsers = Array.from(inMemoryStore.users.values())
          .filter(user => user.roomId === roomId && user.isActive).length;
      }
      
      console.log('Room capacity check:', { currentUsers, maxUsers: room.maxUsers });
      if (currentUsers >= room.maxUsers) {
        socket.emit('join-error', { message: 'Room is full' });
        return;
      }
      
      // Check if user already exists in this room
      let user;
      if (canUseDatabase()) {
        user = await User.findOne({ 
          nickname, 
          roomId, 
          isActive: true 
        });
      } else {
        user = Array.from(inMemoryStore.users.values())
          .find(u => u.nickname === nickname && u.roomId === roomId && u.isActive);
      }
      
      if (user) {
        // Update existing user session
        const newSessionId = sessionId || user.sessionId;
        if (canUseDatabase()) {
          user.sessionId = newSessionId;
          user.lastSeen = new Date();
          await user.save();
        } else {
          user.sessionId = newSessionId;
          user.lastSeen = new Date();
          inMemoryStore.users.set(newSessionId, user);
        }
        console.log('Updated existing user session:', newSessionId);
      } else {
        // Create new user session
        const newSessionId = sessionId || encryption.generateRoomId();
        if (canUseDatabase()) {
          user = new User({
            sessionId: newSessionId,
            roomId,
            nickname,
            isActive: true,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
          });
          await user.save();
        } else {
          user = {
            sessionId: newSessionId,
            roomId,
            nickname,
            isActive: true,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
          };
          inMemoryStore.users.set(newSessionId, user);
        }
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
        currentUsers: currentUsers + 1,
        encryptionKey: room.encryptionKey
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
      
      // Verify user is in the room
      let user;
      if (canUseDatabase()) {
        user = await User.findOne({ 
          nickname, 
          roomId, 
          isActive: true 
        });
      } else {
        user = Array.from(inMemoryStore.users.values())
          .find(u => u.nickname === nickname && u.roomId === roomId && u.isActive);
      }
      
      if (!user) {
        console.log('User not found in room, creating session...');
        // Create user session if not exists
        const newSessionId = socket.sessionId || encryption.generateRoomId();
        if (canUseDatabase()) {
          const newUser = new User({
            sessionId: newSessionId,
            roomId,
            nickname,
            isActive: true,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
          });
          await newUser.save();
        } else {
          const newUser = {
            sessionId: newSessionId,
            roomId,
            nickname,
            isActive: true,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
          };
          inMemoryStore.users.set(newSessionId, newUser);
        }
        socket.sessionId = newSessionId;
        
        // Update client session
        socket.emit('session-updated', { sessionId: newSessionId });
        console.log('Created new user session for message sender:', newSessionId);
      }
      
      // Rate limiting check (simplified for in-memory)
      let messageCount = 0;
      if (canUseDatabase()) {
        messageCount = await Message.countDocuments({
          roomId,
          sender: nickname,
          createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
        });
      } else {
        // Simple in-memory rate limiting
        const recentMessages = Array.from(inMemoryStore.messages.values())
          .filter(m => m.roomId === roomId && m.sender === nickname && 
                 m.createdAt > new Date(Date.now() - 60000));
        messageCount = recentMessages.length;
      }
      
      if (messageCount >= 30) {
        socket.emit('message-error', { message: 'Rate limit exceeded' });
        return;
      }
      
      // Create message
      const messageId = encryption.generateRoomId();
      const messageData = {
        roomId,
        messageId,
        sender: nickname,
        encryptedContent: text,
        iv: 'placeholder',
        expiresAt: expiresAt || new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date()
      };
      
      if (canUseDatabase()) {
        const message = new Message(messageData);
        await message.save();
      } else {
        inMemoryStore.messages.set(messageId, messageData);
      }
      
      // Broadcast to room
      io.to(roomId).emit('new-message', {
        id: messageId,
        sender: nickname,
        text: text,
        timestamp: timestamp || messageData.createdAt,
        expiresAt: messageData.expiresAt
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
    if (canUseDatabase()) {
      // Clean up expired messages
      const deletedMessages = await Message.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      // Clean up expired users
      const deletedUsers = await User.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      // Clean up expired rooms
      const deletedRooms = await Room.updateMany(
        { expiresAt: { $lt: new Date() }, isActive: true },
        { isActive: false }
      );
      
      if (deletedMessages.deletedCount > 0 || deletedUsers.deletedCount > 0 || deletedRooms.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedMessages.deletedCount} expired messages, ${deletedUsers.deletedCount} expired users, and ${deletedRooms.modifiedCount} expired rooms`);
      }
    } else {
      // Clean up in-memory store
      const now = new Date();
      
      // Clean up expired messages
      let expiredMessages = 0;
      for (const [id, message] of inMemoryStore.messages) {
        if (message.expiresAt && message.expiresAt < now) {
          inMemoryStore.messages.delete(id);
          expiredMessages++;
        }
      }
      
      // Clean up expired users
      let expiredUsers = 0;
      for (const [id, user] of inMemoryStore.users) {
        if (user.expiresAt && user.expiresAt < now) {
          inMemoryStore.users.delete(id);
          expiredUsers++;
        }
      }
      
      // Clean up expired rooms
      let expiredRooms = 0;
      for (const [id, room] of inMemoryStore.rooms) {
        if (room.expiresAt && room.expiresAt < now && room.isActive) {
          room.isActive = false;
          expiredRooms++;
        }
      }
      
      if (expiredMessages > 0 || expiredUsers > 0 || expiredRooms > 0) {
        console.log(`🧹 Cleaned up ${expiredMessages} expired messages, ${expiredUsers} expired users, and ${expiredRooms} expired rooms (in-memory)`);
      }
    }
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