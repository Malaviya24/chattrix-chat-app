import io from 'socket.io-client';

// Socket URL configuration with fallback
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://chattrix-chat-app.onrender.com');
console.log('Using Socket URL:', SOCKET_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.encryptionKey = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, returning existing connection');
      return this.socket;
    }

    console.log('Creating new socket connection to:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server with ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      console.error('Connection details:', {
        url: SOCKET_URL,
        error: error.message,
        type: error.type
      });
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    this.socket.on('session-updated', (data) => {
      console.log('Session updated:', data);
      const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
      userSession.sessionId = data.sessionId;
      localStorage.setItem('userSession', JSON.stringify(userSession));
    });

    return this.socket;
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

  // Disconnect
  disconnect() {
    if (this.socket) {
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

  // Enhanced room joining with timeout and better error handling
  joinRoom(roomId, nickname, password, sessionId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Set timeout for room join
      const timeout = setTimeout(() => {
        reject(new Error('Room join timeout - server may be unavailable'));
      }, 15000); // 15 seconds timeout

      // Listen for join response
      this.socket.once('room-info', (data) => {
        clearTimeout(timeout);
        console.log('✅ Room joined successfully:', data);
        resolve(data);
      });

      this.socket.once('join-error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Room join error:', error);
        reject(new Error(error.message || 'Failed to join room'));
      });

      // Emit join room event
      console.log('🔄 Attempting to join room:', { roomId, nickname, sessionId });
      this.socket.emit('join-room', { roomId, nickname, password, sessionId });
    });
  }
}

const socketService = new SocketService();
export default socketService;