import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import apiService from '../services/api';

const CreateRoom = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomLink, setRoomLink] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    return '';
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
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Create Chat Room</h1>
          <p className="text-gray-600 dark:text-gray-300">Set up a secure, private chat room</p>
        </div>

        {!roomId ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className={`input-field dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  passwordError ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Create a password (min 8 characters)"
                required
                disabled={isLoading}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li className={password.length >= 8 ? 'text-green-500' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>One uppercase letter</li>
                  <li className={/[a-z]/.test(password) ? 'text-green-500' : ''}>One lowercase letter</li>
                  <li className={/[0-9]/.test(password) ? 'text-green-500' : ''}>One number</li>
                </ul>
              </div>
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
              {isLoading ? 'Creating Room...' : 'Create Room'}
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Room Created Successfully!</h2>
              <p className="text-gray-600 dark:text-gray-300">Share this link with others to join your room</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Room ID:</span>
                <button
                  onClick={() => copyToClipboard(roomId)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{roomId}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Room Link:</span>
                <button
                  onClick={() => copyToClipboard(roomLink)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{roomLink}</p>
            </div>

            <div className="flex justify-center">
              <QRCodeSVG value={roomLink} size={200} />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(`/room/${roomId}`)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Join Room Now
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                Create Another Room
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default CreateRoom; 