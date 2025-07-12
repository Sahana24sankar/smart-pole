// API Configuration - Updated to match backend port
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

class ApiService {
  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('smartpole_token');
  }

  // Set auth token in localStorage
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('smartpole_token', token);
    } else {
      localStorage.removeItem('smartpole_token');
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem('smartpole_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Get auth headers for API requests
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Generic API request method with better error handling
  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: this.getAuthHeaders(),
      mode: 'cors', // Explicitly enable CORS
      credentials: 'include', // Include credentials for CORS
    };

    try {
      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error('🚨 API Request Failed:', error.message);
      
      // Check if it's a network error (backend not running)
      if (error.message.includes('fetch')) {
        console.warn('⚠️ Backend appears to be offline');
        throw new Error('Backend server is not running. Please start the backend server.');
      }
      
      throw error;
    }
  }

  // Authentication with better error handling
  async login(credentials) {
    try {
      console.log('🔐 Attempting login...');
      const data = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (data.success && data.token) {
        this.setAuthToken(data.token);
        console.log('✅ Login successful');
        return data;
      }
      throw new Error('Login failed - invalid response');
    } catch (error) {
      console.warn('⚠️ Backend login failed, using mock authentication');
      if (credentials.username && credentials.password) {
        const mockToken = 'mock-jwt-token-' + Date.now();
        this.setAuthToken(mockToken);
        return {
          success: true,
          token: mockToken,
          user: {
            username: credentials.username,
            role: 'user'
          }
        };
      }
      throw new Error('Invalid credentials');
    }
  }

  // Upload method specifically for file uploads
  async uploadAd(poleId, formData) {
    const url = `${API_BASE_URL}/poles/${poleId}/ads`;
    
    try {
      console.log(`📤 Uploading file to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        // Don't set Content-Type header for FormData - let browser set it
        headers: {
          ...(this.getAuthToken() && { 'Authorization': `Bearer ${this.getAuthToken()}` })
        },
        body: formData,
      });

      console.log(`📨 Upload response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Upload failed:`, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Upload successful:`, result);
      return result;
    } catch (error) {
      console.error('🚨 Upload error:', error.message);
      throw error;
    }
  }

  async logout() {
    try {
      await this.makeRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Backend logout failed, clearing local auth');
    }
    this.clearAuth();
    return { success: true };
  }

  // Poles API
  async getPoles() {
    try {
      return await this.makeRequest('/poles');
    } catch (error) {
      console.warn('⚠️ Backend not available, using mock poles data');
      return {
        success: true,
        poles: [
          { id: 1, pole_number: 1, location: 'Main Street', status: 'active' },
          { id: 2, pole_number: 2, location: 'Park Avenue', status: 'active' },
          { id: 3, pole_number: 3, location: 'Downtown Plaza', status: 'active' }
        ]
      };
    }
  }

  // Ads API
  async getAds(poleId) {
    try {
      return await this.makeRequest(`/poles/${poleId}/ads`);
    } catch (error) {
      console.warn('⚠️ Backend not available, returning empty ads list');
      return { success: true, ads: [] };
    }
  }

  async updateAd(adId, updateData) {
    try {
      return await this.makeRequest(`/ads/${adId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.warn('Backend update not available');
      throw error;
    }
  }

  async deleteAd(adId) {
    try {
      return await this.makeRequest(`/ads/${adId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Backend delete not available');
      throw error;
    }
  }

  // Time Slots API
  async getTimeSlots(poleId) {
    try {
      return await this.makeRequest(`/poles/${poleId}/timeslots`);
    } catch (error) {
      console.warn('Backend not available, returning default time slots');
      return {
        success: true,
        timeSlots: [
          { id: 1, start_time: '08:00', end_time: '12:00', description: 'Morning Slot', duration: 30 },
          { id: 2, start_time: '12:00', end_time: '18:00', description: 'Afternoon Slot', duration: 30 },
          { id: 3, start_time: '18:00', end_time: '22:00', description: 'Evening Slot', duration: 30 }
        ]
      };
    }
  }

  async updateTimeSlot(slotId, updateData) {
    try {
      return await this.makeRequest(`/timeslots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.warn('Backend update not available');
      throw error;
    }
  }

  async assignAdToSlot(slotId, adId) {
    try {
      return await this.makeRequest(`/timeslots/${slotId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ ad_id: adId }),
      });
    } catch (error) {
      console.warn('Backend assignment not available');
      throw error;
    }
  }
}

export default new ApiService();
