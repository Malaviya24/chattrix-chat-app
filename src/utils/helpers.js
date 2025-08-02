// Generate a random room ID
export const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Format time left for message expiration
export const formatTimeLeft = (expiresAt) => {
  const now = new Date();
  const timeLeft = expiresAt - now;
  
  if (timeLeft <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Check if message is expired
export const isMessageExpired = (expiresAt) => {
  return new Date(expiresAt) <= new Date();
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Validate room password
export const validatePassword = (password) => {
  return password && password.trim().length >= 3;
};

// Validate nickname
export const validateNickname = (nickname) => {
  return nickname && nickname.trim().length >= 2;
};

// Get room data from localStorage
export const getRoomData = (roomId) => {
  try {
    const roomData = localStorage.getItem(`room_${roomId}`);
    return roomData ? JSON.parse(roomData) : null;
  } catch (error) {
    console.error('Error getting room data:', error);
    return null;
  }
};

// Save room data to localStorage
export const saveRoomData = (roomId, data) => {
  try {
    localStorage.setItem(`room_${roomId}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving room data:', error);
    return false;
  }
};

// Get messages from localStorage
export const getMessages = (roomId) => {
  try {
    const messages = localStorage.getItem(`messages_${roomId}`);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Save messages to localStorage
export const saveMessages = (roomId, messages) => {
  try {
    localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
};

// Clear room data
export const clearRoomData = (roomId) => {
  try {
    localStorage.removeItem(`room_${roomId}`);
    localStorage.removeItem(`messages_${roomId}`);
    return true;
  } catch (error) {
    console.error('Error clearing room data:', error);
    return false;
  }
}; 