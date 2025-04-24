// ai-intent-client.js
// Client-side helper for AI intent API with session management

/**
 * AI Intent API client with session management
 * Ensures all requests use the same session ID for conversation continuity
 */
class AIIntentClient {
  constructor(apiUrl = '/api/ai-intent') {
    this.apiUrl = apiUrl;
    this.sessionId = this.getOrCreateSessionId();
    console.log('AI Intent Client initialized with session ID:', this.sessionId);
  }

  /**
   * Get existing session ID from localStorage or create a new one
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('ai_intent_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('ai_intent_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Send a prompt to the AI intent API with session tracking
   * @param {string} prompt - The user's natural language prompt
   * @returns {Promise<Object>} - API response
   */
  async sendPrompt(prompt) {
    try {
      console.log(`Sending prompt with session ID: ${this.sessionId}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        body: JSON.stringify({ prompt })
      });
      
      const result = await response.json();
      console.log('AI Intent API response:', result);
      return result;
    } catch (error) {
      console.error('Error calling AI Intent API:', error);
      throw error;
    }
  }

  /**
   * Reset the current session
   */
  resetSession() {
    this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('ai_intent_session_id', this.sessionId);
    console.log('Session reset, new session ID:', this.sessionId);
  }
}

// Export for module environments or attach to window for direct browser use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AIIntentClient };
} else {
  window.AIIntentClient = AIIntentClient;
}
