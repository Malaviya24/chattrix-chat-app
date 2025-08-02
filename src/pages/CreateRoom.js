import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../utils/ThemeContext';
import apiService from '../services/api';

const CreateRoom = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomLink, setRoomLink] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let generatedPassword = '';
    
    // Ensure at least one of each required character type
    generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
    generatedPassword += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    generatedPassword = generatedPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(generatedPassword);
    setPasswordError('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setError('');
    setIsLoading(true);

    if (!nickname.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.createRoom(nickname, password);
      
      const newRoomId = response.roomId;
      const newRoomLink = `${window.location.origin}/join?roomId=${newRoomId}`;

      setRoomId(newRoomId);
      setRoomLink(newRoomLink);
    } catch (error) {
      setError(error.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Matrix-style background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-black to-green-900/20"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-lime-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          className="max-w-md w-full bg-black/50 backdrop-blur-sm rounded-3xl border border-green-400/30 shadow-2xl p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-2">
              Create Secure Room
            </h1>
            <p className="text-green-300">Set up your private, encrypted chat room</p>
          </div>

          {!roomId ? (
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-green-300 mb-3">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-green-400/30 rounded-xl text-green-300 placeholder-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm"
                  placeholder="Enter your nickname"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-300 mb-3">
                  Room Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`w-full px-4 py-3 pr-24 bg-black/50 border rounded-xl text-green-300 placeholder-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm ${
                      passwordError ? 'border-red-400 focus:ring-red-400' : 'border-green-400/30'
                    }`}
                    placeholder="Create a strong password"
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 text-green-400 hover:text-green-300 transition-colors"
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
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-2 py-1 text-xs bg-gradient-to-r from-green-500 to-emerald-600 text-black font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                      disabled={isLoading}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {passwordError && (
                  <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                )}
                <div className="mt-3 text-xs text-green-400">
                  <p className="mb-2">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <div className={`flex items-center space-x-1 ${password.length >= 8 ? 'text-green-400' : 'text-green-600'}`}>
                      <span>{password.length >= 8 ? '✓' : '○'}</span>
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-green-600'}`}>
                      <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                      <span>Uppercase</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-green-600'}`}>
                      <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                      <span>Lowercase</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-green-600'}`}>
                      <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                      <span>Number</span>
                    </div>
                  </div>
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

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 border-2 border-green-400"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Creating Room...' : '🚀 Create Secure Room'}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-400 mb-2">Room Created Successfully!</h2>
                <p className="text-green-300">Share this link with others to join your room</p>
              </div>

              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-300">Room ID:</span>
                  <button
                    onClick={() => copyToClipboard(roomId)}
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-green-400 break-all font-mono">{roomId}</p>
              </div>

              <div className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-300">Room Link:</span>
                  <button
                    onClick={() => copyToClipboard(roomLink)}
                    className="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-green-400 break-all">{roomLink}</p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={roomLink} size={150} />
                </div>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => navigate(`/room/${roomId}`)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-400"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  🎯 Join Room Now
                </motion.button>
                <motion.button
                  onClick={() => navigate('/')}
                  className="w-full bg-black/50 border border-green-400/30 text-green-400 font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:bg-black/70 hover:border-green-400/60"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ➕ Create Another Room
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CreateRoom; 