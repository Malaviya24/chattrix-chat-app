import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import socketService from '../services/socket';

const ChatRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInvisible, setIsInvisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  // Get user session data
  const userSession = useMemo(() => {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
  }, []);

  useEffect(() => {
    if (!userSession) {
      navigate('/join');
      return;
    }

    setCurrentUser({
      nickname: userSession.nickname,
      roomId: userSession.roomId
    });

    // Connect to socket and join room
    const joinRoom = async () => {
      try {
        const roomInfo = await socketService.joinRoom(
          roomId,
          userSession.nickname,
          userSession.password || '', // You might need to store password temporarily
          userSession.sessionId
        );

        setMessages(roomInfo.messages || []);
        setIsConnected(true);

        // Set up socket listeners
        socketService.onNewMessage((message) => {
          setMessages(prev => [...prev, message]);
        });

        socketService.onUserJoined((data) => {
          // Add system message for user joined
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'System',
            text: data.message,
            timestamp: new Date(),
            isSystem: true
          }]);
        });

        socketService.onUserLeft((data) => {
          // Add system message for user left
          setMessages(prev => [...prev, {
            id: Date.now(),
            sender: 'System',
            text: data.message,
            timestamp: new Date(),
            isSystem: true
          }]);
        });

        socketService.onPanicMode((data) => {
          setMessages([]);
          alert('Panic mode activated! All messages have been cleared.');
        });

        socketService.onError((error) => {
          setError(error.message);
        });

      } catch (error) {
        setError(error.message);
        console.error('Failed to join room:', error);
      }
    };

    joinRoom();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [roomId, userSession, navigate]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    try {
      socketService.sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      setError('Failed to send message');
    }
  };

  const handleToggleInvisible = () => {
    setIsInvisible(!isInvisible);
    socketService.toggleInvisible(!isInvisible);
  };

  const handlePanicMode = () => {
    if (window.confirm('Are you sure you want to activate panic mode? This will clear all messages and redirect you.')) {
      socketService.triggerPanicMode();
      navigate('/panic');
    }
  };

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return '';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="font-semibold text-gray-800 dark:text-white">Room: {roomId}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logged in as: {currentUser.nickname}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleInvisible}
              className={`px-3 py-1 rounded text-sm ${
                isInvisible 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {isInvisible ? 'Visible' : 'Invisible'}
            </button>
            
            <button
              onClick={handlePanicMode}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Panic
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
          {error}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${
              message.sender === currentUser.nickname ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md p-3 rounded-lg shadow-md ${
                message.isSystem
                  ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  : message.sender === currentUser.nickname
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white'
              } ${isInvisible && message.sender !== currentUser.nickname ? 'blur-sm' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs opacity-75">
                  {message.sender}
                </span>
                {message.expiresAt && (
                  <span className="text-xs opacity-75">
                    {formatTimeLeft(message.expiresAt)}
                  </span>
                )}
              </div>
              <p className="text-sm">{message.text || message.encryptedContent}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
            disabled={isInvisible || !isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isInvisible || !isConnected}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Send
          </button>
        </form>
        {isInvisible && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            You are invisible. Messages from others are blurred.
          </p>
        )}
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2 text-center">
            Connecting to server...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatRoom; 