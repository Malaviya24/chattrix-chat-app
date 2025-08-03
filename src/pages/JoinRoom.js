import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../utils/ThemeContext';
import apiService from '../services/api';

const JoinRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode } = useTheme();
  const [roomId, setRoomId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    const roomIdFromUrl = searchParams.get('roomId');
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
    }
  }, [searchParams]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!roomId.trim() || !nickname.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.joinRoom(roomId, nickname, password);
      
      setRoomInfo({
        roomId,
        roomLink: `${window.location.origin}/join?roomId=${roomId}`,
        nickname
      });

      localStorage.setItem('userSession', JSON.stringify({
        sessionId: response.sessionId,
        encryptionKey: response.encryptionKey,
        roomId: roomId,
        nickname: nickname,
        password: password // Store password temporarily for immediate join
      }));

      // Show success page instead of automatic redirect
      setJoinSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  if (joinSuccess && roomInfo) {
    return (
      <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${
            isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
          }`}></div>
          <div className={`absolute top-40 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${
            isDarkMode ? 'bg-cyan-500' : 'bg-cyan-300'
          }`}></div>
          <div className={`absolute -bottom-8 left-40 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${
            isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
          }`}></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <motion.div
            className={`max-w-md w-full backdrop-blur-sm rounded-3xl border shadow-2xl p-8 ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/90 border-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                Room Joined!
              </h1>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                You have successfully joined the room. Your nickname is: {roomInfo.nickname}
              </p>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Your Room Link:</h2>
              <div className="flex items-center justify-center bg-white/10 p-3 rounded-xl border border-white/20">
                <span className="text-lg font-medium text-white mr-2">{roomInfo.roomLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomInfo.roomLink);
                    // You could add a toast notification here
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy Link"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-8">
              <motion.button
                type="button"
                onClick={() => navigate(`/room/${roomInfo.roomId}`)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🎯 Enter Chat Room
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => navigate('/')}
                className={`w-full border font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-white/80 border-gray-200 text-gray-800 hover:bg-white/90'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Back to Home
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className={`absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob ${
          isDarkMode ? 'bg-purple-500' : 'bg-purple-300'
        }`}></div>
        <div className={`absolute top-40 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 ${
          isDarkMode ? 'bg-cyan-500' : 'bg-cyan-300'
        }`}></div>
        <div className={`absolute -bottom-8 left-40 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 ${
          isDarkMode ? 'bg-blue-500' : 'bg-blue-300'
        }`}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          className={`max-w-md w-full backdrop-blur-sm rounded-3xl border shadow-2xl p-8 ${
            isDarkMode 
              ? 'bg-white/10 border-white/20' 
              : 'bg-white/90 border-gray-200'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
              Join Chat Room
            </h1>
            <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Enter the room details to join the conversation</p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white/80 border-gray-200 text-gray-800'
                }`}
                placeholder="Enter room ID"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white' 
                    : 'bg-white/80 border-gray-200 text-gray-800'
                }`}
                placeholder="Enter your nickname"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Room Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white/80 border-gray-200 text-gray-800'
                  }`}
                  placeholder="Enter room password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-xl text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-3">
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Joining Room...' : '🚀 Join Room'}
              </motion.button>
              
              <motion.button
                type="button"
                onClick={() => navigate('/')}
                className={`w-full border font-semibold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 ${
                  isDarkMode 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-white/80 border-gray-200 text-gray-800 hover:bg-white/90'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Back to Home
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinRoom; 