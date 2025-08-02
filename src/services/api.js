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
        credentials: 'include',
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
      throw error;
    }
  }

  // Create room with CSRF protection
  async createRoom(nickname, password) {
    try {
      const csrfToken = await this.getCSRFToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken
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

  // Join room with CSRF protection
  async joinRoom(roomId, nickname, password) {
    try {
      const csrfToken = await this.getCSRFToken();
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-Token': csrfToken
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