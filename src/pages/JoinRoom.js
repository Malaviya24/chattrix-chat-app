import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import apiService from '../services/api';

const JoinRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get('roomId');
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!nickname.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.joinRoom(roomIdFromUrl, nickname, password);
      
      // Store user session data
      localStorage.setItem('userSession', JSON.stringify({
        sessionId: response.user.sessionId,
        nickname: response.user.nickname,
        roomId: response.user.roomId,
        encryptionKey: response.encryptionKey
      }));

      // Navigate to chat room
      navigate(`/room/${roomIdFromUrl}`);
    } catch (error) {
      setError(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        className="card max-w-md w-full bg-white dark:bg-gray-800 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Join Chat Room</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {roomIdFromUrl ? `Joining room: ${roomIdFromUrl}` : 'Enter room details'}
          </p>
        </div>

        {!roomIdFromUrl ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">No room ID provided in the URL.</p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Enter your nickname"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Room Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                placeholder="Enter room password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Joining Room...' : 'Join Room'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                Back to Home
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default JoinRoom; 