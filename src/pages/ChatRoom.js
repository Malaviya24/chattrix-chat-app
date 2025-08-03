import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';
import { generateAvatar } from '../utils/avatar';
import socketService from '../services/socket';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isInvisible, setIsInvisible] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load user session from localStorage
  useEffect(() => {
    try {
      const session = localStorage.getItem('userSession');
      if (session) {
        const parsedSession = JSON.parse(session);
        setUserSession(parsedSession);
      } else {
        console.log('No user session found, redirecting to home');
        navigate('/');
      }
    } catch (err) {
      console.error('Error loading user session:', err);
      navigate('/');
    }
  }, [navigate]);

  // Screenshot detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        (e.metaKey && e.shiftKey && e.key === '4')
      ) {
        setScreenshotWarning(true);
        setTimeout(() => setScreenshotWarning(false), 5000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection and event handling
  useEffect(() => {
    if (!userSession || !roomId) return;

    let socket = null;
    
    try {
      console.log('Setting up socket connection...');
      console.log('User session:', userSession);
      console.log('Room ID:', roomId);
      
      socket = socketService.connect();
      setIsConnecting(true);
      setError(null);

      // Join room with proper data
      const joinData = {
        roomId,
        nickname: userSession.nickname,
        password: userSession.password,
        sessionId: userSession.sessionId
      };
      
      console.log('Joining room with data:', joinData);
      socket.emit('join-room', joinData);

      // Listen for events
      socket.on('connect', () => {
        console.log('Connected to socket server');
        setIsConnecting(false);
        setError(null);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setError('Failed to connect to chat server. Please check your connection and try again.');
        setIsConnecting(false);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
        setError(error.message || 'Connection error occurred');
        setIsConnecting(false);
      });

      socket.on('join-error', (error) => {
        console.error('Join room error:', error);
        setError(error.message || 'Failed to join room. Please check your credentials.');
        setIsConnecting(false);
      });

      socket.on('room-info', (data) => {
        console.log('Room info received:', data);
        setIsConnecting(false);
        setError(null);
      });

      socket.on('new-message', (message) => {
        console.log('New message received:', message);
        setMessages(prev => [...prev, message]);
      });

      socket.on('user-joined', (data) => {
        console.log('User joined:', data);
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'System',
          text: `${data.user.nickname} joined the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
      });

      socket.on('user-left', (data) => {
        console.log('User left:', data);
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'System',
          text: `${data.user.nickname} left the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
      });

      socket.on('user-typing', (data) => {
        if (data.nickname !== userSession.nickname) {
          setTypingUsers(prev => [...prev.filter(u => u !== data.nickname), data.nickname]);
        }
      });

      socket.on('user-stop-typing', (data) => {
        if (data.nickname !== userSession.nickname) {
          setTypingUsers(prev => prev.filter(u => u !== data.nickname));
        }
      });

      socket.on('panic-mode', (data) => {
        setMessages([]);
        alert('Panic mode activated! All messages cleared.');
      });

      socket.on('session-updated', (data) => {
        console.log('Session updated:', data);
        const updatedSession = { ...userSession, sessionId: data.sessionId };
        setUserSession(updatedSession);
        localStorage.setItem('userSession', JSON.stringify(updatedSession));
      });

      // Set a timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (isConnecting) {
          console.error('Connection timeout');
          setError('Connection timeout. Please refresh the page and try again.');
          setIsConnecting(false);
        }
      }, 10000); // Back to 10 seconds timeout

      return () => {
        console.log('Cleaning up socket connection');
        clearTimeout(connectionTimeout);
        if (socket) {
          socket.disconnect();
        }
      };
    } catch (err) {
      console.error('Error setting up socket:', err);
      setError('Failed to connect to chat server. Please refresh the page and try again.');
      setIsConnecting(false);
    }
  }, [roomId, userSession]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || isConnecting) return;

    try {
      // Get the current socket instance
      const socket = socketService.socket;
      
      // Check if socket is available and connected
      if (!socket || !socket.connected) {
        console.error('Socket not connected, attempting to reconnect...');
        setError('Connection lost. Please refresh the page.');
        return;
      }

      const message = {
        text: newMessage.trim(),
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      };

      console.log('Sending message:', message);
      
      // Use the socket directly instead of socketService.sendMessage
      socket.emit('send-message', message);
      
      setNewMessage('');
      setIsTyping(false);
      
      // Stop typing indicator
      if (socket.connected) {
        socket.emit('stop-typing');
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping();
    }
    
    // Stop typing after 2 seconds of no input
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socketService.stopTyping();
    }, 2000);
  };

  const toggleInvisible = () => {
    setIsInvisible(!isInvisible);
    socketService.toggleInvisible(!isInvisible);
  };

  const triggerPanicMode = () => {
    if (window.confirm('Are you sure you want to activate panic mode? This will clear all messages!')) {
      socketService.triggerPanicMode();
      navigate('/panic');
    }
  };

  // Show loading state
  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat room...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-6 py-4 rounded-xl mb-4">
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Screenshot Warning */}
      {screenshotWarning && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg"
        >
          ⚠️ Screenshot detected! Your privacy may be compromised.
        </motion.div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center space-x-4">
          <h1 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            Room: {roomId}
          </h1>
          <span className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {messages.length} messages
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Invisible Toggle */}
          <button
            onClick={toggleInvisible}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              isInvisible
                ? 'bg-red-500/20 border border-red-400/50 text-red-300'
                : isDarkMode 
                  ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                  : 'bg-white/80 border border-gray-200 text-gray-800 hover:bg-white/90'
            }`}
          >
            {isInvisible ? '🕶️ Invisible' : '👁️ Visible'}
          </button>
          
          {/* Panic Mode Button */}
          <button
            onClick={triggerPanicMode}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-semibold"
          >
            🚨 Panic
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === userSession?.nickname ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.isSystem
                ? 'bg-yellow-500/20 border border-yellow-400/50 text-yellow-300'
                : message.sender === userSession?.nickname
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                : isDarkMode 
                  ? 'bg-white/10 border border-white/20 text-white'
                  : 'bg-white/80 border border-gray-200 text-gray-800'
            } ${isInvisible && message.sender !== userSession?.nickname ? 'blur-sm' : ''}`}>
              <div className="flex items-center space-x-2 mb-1">
                {!message.isSystem && (
                  <img 
                    src={generateAvatar(message.sender)} 
                    alt={`${message.sender}'s avatar`}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-xs opacity-75">{message.sender}</span>
                <span className="text-xs opacity-50">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
                {message.expiresAt && (
                  <span className="text-xs opacity-50">
                    ⏰ {Math.max(0, Math.floor((new Date(message.expiresAt) - new Date()) / 1000 / 60))}m
                  </span>
                )}
              </div>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              isDarkMode ? 'bg-white/10 border border-white/20' : 'bg-white/80 border border-gray-200'
            }`}>
              <p className="text-xs opacity-75">
                {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}
        
        {isConnecting && (
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto mb-2"></div>
            Connecting to server...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t ${
        isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Emoji Picker Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            😊
          </button>
          
          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                : 'bg-white/80 border-gray-200 text-gray-800 placeholder-gray-500'
            }`}
            disabled={isConnecting}
          />
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isConnecting}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg transition-all duration-200 font-semibold"
          >
            Send
          </button>
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className={`mt-3 p-4 rounded-lg border ${
            isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white/90 border-gray-200'
          }`}>
            <div className="grid grid-cols-8 gap-2">
              {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '😎', '🤔', '😭', '😡', '🤯', '🥳', '😴', '🤫', '😱', '😄', '😅', '😆', '😉', '😋', '😎', '😍', '🤩', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥴', '🥺', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓', '😈', '👿', '👹', '👺', '💀', '👻', '👽', '🤖', '💩', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-2xl hover:scale-110 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;