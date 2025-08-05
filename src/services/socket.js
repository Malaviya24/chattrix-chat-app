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
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
  }

  // Initialize socket connection
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, returning existing connection');
      return this.socket;
    }

    console.log('🔄 Attempting to connect to:', SOCKET_URL);
    
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Start with polling for better compatibility
      timeout: 60000, // Increase timeout to 60 seconds for Render spin-down
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      maxHttpBufferSize: 1e6,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Connected successfully:', this.socket.id);
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
      this.isConnected = false;
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.isConnected = false;
      this.connectionAttempts++;
      
      if (this.connectionAttempts >= this.maxAttempts) {
        console.error('Max connection attempts reached');
        throw new Error('Failed to connect to server after multiple attempts');
      }
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

  async joinRoom(roomId, nickname, password, sessionId) {
    return new Promise((resolve, reject) => {
      // Check if socket is connected
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      if (!this.socket.connected) {
        reject(new Error('Socket not connected to server'));
        return;
      }

      console.log('🚪 Attempting to join room:', { roomId, nickname });

      // Set longer timeout for room join (30 seconds for Render spin-down)
      const joinTimeout = setTimeout(() => {
        console.error('⏰ Room join timeout');
        reject(new Error('Connection timeout. Server might be starting up.'));
      }, 30000); // 30 seconds timeout

      // Listen for successful room join
      this.socket.once('room-joined', (data) => {
        clearTimeout(joinTimeout);
        console.log('✅ Successfully joined room:', data);
        resolve(data);
      });

      // Listen for room join errors
      this.socket.once('room-join-error', (error) => {
        clearTimeout(joinTimeout);
        console.error('❌ Room join failed:', error);
        reject(new Error(error.message || 'Failed to join room'));
      });

      // Listen for general errors
      this.socket.once('error', (error) => {
        clearTimeout(joinTimeout);
        console.error('❌ Socket error:', error);
        reject(new Error('Connection error occurred'));
      });

      // Emit the join room event
      this.socket.emit('join-room', { 
        roomId, 
        nickname, 
        password,
        sessionId,
        timestamp: Date.now()
      });
    });
  }

  // Add connection status check method
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Add reconnection method
  async reconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    return this.connect();
  }
}

const socketService = new SocketService();
export default socketService;