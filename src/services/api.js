const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://chattrix-chat-app.onrender.com';

class ApiService {
  constructor() {
    this.csrfToken = null;
    this.tokenExpiry = null;
  }

  // Get CSRF token with enhanced security
  async getCSRFToken() {
    try {
      // Check if we have a valid token
      if (this.csrfToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.csrfToken;
      }

      const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get CSRF token: ${response.status}`);
      }

      const data = await response.json();
      this.csrfToken = data.csrfToken;
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours (refresh before 24h expiry)
      
      return this.csrfToken;
    } catch (error) {
      console.error('CSRF token error:', error);
      // Return a fallback token for development
      return 'development-token';
    }
  }

  // Create room - temporarily disable CSRF for debugging
  async createRoom(nickname, password, maxUsers = 10) {
    try {
      console.log('Creating room with nickname:', nickname, 'maxUsers:', maxUsers);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nickname, password, maxUsers })
      });
      
      console.log('Create room response status:', response.status);
      console.log('Create room response ok:', response.ok);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create room');
      }

      return response.json();
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }

  // Join room - temporarily disable CSRF for debugging
  async joinRoom(roomId, nickname, password) {
    try {
      console.log('Attempting to join room:', roomId, 'with nickname:', nickname);
      console.log('API Base URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ nickname, password })
      });
      
      console.log('Join room response status:', response.status);
      console.log('Join room response ok:', response.ok);

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