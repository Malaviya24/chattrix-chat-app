const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chattrix-chat-app.onrender.com';

class ApiService {
  constructor() {
    this.csrfToken = null;
  }

  // Get CSRF token (temporarily disabled)
  async getCSRFToken() {
    // Temporarily return null to skip CSRF
    return null;
  }

  // Create room
  async createRoom(nickname, password) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ nickname, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create room: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }

  // Join room
  async joinRoom(roomId, nickname, password) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ nickname, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to join room: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  }

  // Get room info
  async getRoomInfo(roomId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to get room info: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get room info error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();
export default apiService; 