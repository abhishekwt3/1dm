/**
 * Gets the current username from localStorage
 * @returns {string} The current username or 'current_user' if not found
 */
export function getCurrentUsername() {
    try {
      const userInfoString = localStorage.getItem('user_info');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.user_name) {
          return userInfo.user_name;
        }
      }
    } catch (e) {
      console.error("Error parsing user info:", e);
    }
    
    return "current_user"; // Default fallback
  }
  
  /**
   * Gets the authentication token from localStorage
   * @returns {string|null} The auth token or null if not found
   */
  export function getAuthToken() {
    return localStorage.getItem('auth_token');
  }
  
  /**
   * Gets the user's full information from localStorage
   * @returns {Object|null} The user info object or null if not found/invalid
   */
  export function getUserInfo() {
    try {
      const userInfoString = localStorage.getItem('user_info');
      if (userInfoString) {
        return JSON.parse(userInfoString);
      }
    } catch (e) {
      console.error("Error parsing user info:", e);
    }
    
    return null;
  }
  
  /**
   * Updates the user info in localStorage
   * @param {Object} updates - The fields to update
   * @returns {boolean} Success status
   */
  export function updateUserInfo(updates) {
    try {
      const currentInfo = getUserInfo() || {};
      localStorage.setItem('user_info', JSON.stringify({
        ...currentInfo,
        ...updates
      }));
      return true;
    } catch (e) {
      console.error("Error updating user info:", e);
      return false;
    }
  }
  
  /**
   * Creates authorization headers for API requests
   * @returns {Object} Headers object with Authorization
   */
  export function getAuthHeaders() {
    const token = getAuthToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }