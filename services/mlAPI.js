const API_BASE_URL = 'http://localhost:5000/api';

export const mlAPI = {
  /**
   * Predict risk escalation using backend models
   */
  async predictEscalation(assessmentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict-escalation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessmentData)
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Get resource recommendations
   */
  async recommendResources(profile, resources) {
    try {
      const response = await fetch(`${API_BASE_URL}/recommend-resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile,
          resources
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML API Error:', error);
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  },

  /**
   * Analyze assessment trend
   */
  async analyzeTrend(assessments) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-trend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessments
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Health check
   */
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:5000/health');
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
};

export default mlAPI;