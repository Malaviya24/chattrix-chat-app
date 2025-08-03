import io from 'socket.io-client';

// Updated to use deployed backend URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://chattrix-backend.onrender.com';

class SocketService {
  constructor() {
    this.socket = null;
    this.encryptionKey = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, returning existing connection');
      return this.socket;
    }

    console.log('Creating new socket connection to:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 20000, // Increased to 20 seconds
      forceNew: false, // Reuse connections
      reconnection: true,
      reconnectionAttempts: 10, // Increased attempts
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Increased max delay
      maxReconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    this.socket.on('session-updated', (data) => {
      console.log('Session updated:', data);
      // Update localStorage with new sessionId
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      userSession.sessionId = data.sessionId;
      localStorage.setItem('userSession', JSON.stringify(userSession));
    });

    return this.socket;
  }

  // Join room
  async joinRoom(roomId, nickname, password, sessionId) {
    if (!this.socket) {
      this.connect();
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('join-room', {
        roomId,
        nickname,
        password,
        sessionId
      });

      this.socket.once('room-info', (data) => {
        this.encryptionKey = data.encryptionKey;
        resolve(data);
      });

      this.socket.once('error', (error) => {
        reject(new Error(error.message));
      });
    });
  }

  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('send-message', message);
    }
  }

  startTyping() {
    if (this.socket) {
      this.socket.emit('start-typing');
    }
  }

  stopTyping() {
    if (this.socket) {
      this.socket.emit('stop-typing');
    }
  }

  // Mark message as read
  markMessageAsRead(messageId) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('mark-read', { messageId });
  }

  // Toggle invisible mode
  toggleInvisible(isInvisible) {
    if (!this.socket) {
      return;
    }

    this.socket.emit('toggle-invisible', { isInvisible });
  }

  // Trigger panic mode
  triggerPanicMode() {
    if (!this.socket) {
      return;
    }

    this.socket.emit('panic-mode');
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('new-message', callback);
    this.listeners.set('new-message', callback);
  }

  // Listen for user joined
  onUserJoined(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('user-joined', callback);
    this.listeners.set('user-joined', callback);
  }

  // Listen for user left
  onUserLeft(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('user-left', callback);
    this.listeners.set('user-left', callback);
  }

  // Listen for user invisible
  onUserInvisible(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('user-invisible', callback);
    this.listeners.set('user-invisible', callback);
  }

  // Listen for panic mode
  onPanicMode(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('panic-mode', callback);
    this.listeners.set('panic-mode', callback);
  }

  // Listen for errors
  onError(callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on('error', callback);
    this.listeners.set('error', callback);
  }

  // Remove all listeners
  removeAllListeners() {
    if (!this.socket) {
      return;
    }

    this.listeners.forEach((callback, event) => {
      this.socket.off(event, callback);
    });
    this.listeners.clear();
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.encryptionKey = null;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService(); 