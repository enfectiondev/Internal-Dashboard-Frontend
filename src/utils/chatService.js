/**
 * Chat Service for handling AI chat API calls
 */

class ChatService {
  constructor() {
    this.baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api`;
  }

  /**
   * Get authentication headers
   * @returns {object} Headers with auth token
   */
  getHeaders() {
    const token = localStorage.getItem("token");
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  /**
   * Send a message to the AI chat API
   * @param {object} params - Chat parameters
   * @param {string} params.message - User message
   * @param {string} params.chatType - Type of chat ('ads', 'analytics', 'intent')
   * @param {object} params.context - Additional context (campaign, property, account)
   * @param {string} params.period - Time period filter
   * @returns {Promise<object>} AI response
   */
  async sendMessage({ message, chatType, context, period }) {
    try {
      const payload = {
        message,
        chat_type: chatType,
        period,
        context: this.formatContext(context, chatType)
      };

      const response = await fetch(`${this.baseUrl}/chat/${chatType}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.response || data.message || "I received your message but couldn't generate a proper response.",
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Chat API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send message',
        fallbackResponse: this.getFallbackResponse(chatType, message)
      };
    }
  }

  /**
   * Format context data based on chat type
   * @param {object} context - Raw context data
   * @param {string} chatType - Type of chat
   * @returns {object} Formatted context
   */
  formatContext(context, chatType) {
    switch (chatType) {
      case 'ads':
        return {
          campaign_id: context?.activeCampaign?.id,
          campaign_name: context?.activeCampaign?.name,
          campaign_status: context?.activeCampaign?.status,
          campaign_type: context?.activeCampaign?.type,
          metrics: context?.metrics
        };
      case 'analytics':
        return {
          property_id: context?.activeProperty?.id,
          property_name: context?.activeProperty?.name,
          property_url: context?.activeProperty?.websiteUrl,
          metrics: context?.metrics
        };
      case 'intent':
        return {
          account_id: context?.selectedAccount?.id || context?.selectedAccount?.customerId,
          account_name: context?.selectedAccount?.name || context?.selectedAccount?.descriptiveName,
          keywords: context?.seedKeywords || [],
          country: context?.selectedCountry
        };
      default:
        return context || {};
    }
  }

  /**
   * Get fallback response when API fails
   * @param {string} chatType - Type of chat
   * @param {string} message - User message
   * @returns {string} Fallback response
   */
  getFallbackResponse(chatType, message) {
    const fallbacks = {
      ads: [
        "I'm analyzing your campaign performance. While I can't access real-time data right now, I recommend checking your cost per conversion and pausing underperforming keywords.",
        "Your Google Ads optimization depends on several factors. Consider reviewing your keyword match types and ad copy performance.",
        "For better campaign results, focus on improving your Quality Score and testing different bidding strategies."
      ],
      analytics: [
        "Based on typical website analytics patterns, I'd suggest reviewing your page load speeds and user flow optimization.",
        "Website performance can be improved by analyzing bounce rates and optimizing your most visited pages.",
        "Consider examining your traffic sources and conversion paths to identify optimization opportunities."
      ],
      intent: [
        "Keyword research shows that long-tail keywords often have better conversion rates and lower competition.",
        "Search intent analysis suggests focusing on commercial and transactional keywords for better ROI.",
        "Consider seasonal trends in your keyword planning and adjust your strategy accordingly."
      ]
    };

    const typeResponses = fallbacks[chatType] || fallbacks.ads;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  /**
   * Get conversation history
   * @param {string} chatType - Type of chat
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>} Conversation history
   */
  async getConversationHistory(chatType, sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${chatType}/history/${sessionId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
      return [];
    }
  }

  /**
   * Clear conversation history
   * @param {string} chatType - Type of chat
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} Success status
   */
  async clearConversationHistory(chatType, sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${chatType}/history/${sessionId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      return false;
    }
  }

  /**
   * Get suggested questions based on chat type and context
   * @param {string} chatType - Type of chat
   * @param {object} context - Context data
   * @returns {Array<string>} Suggested questions
   */
  getSuggestedQuestions(chatType, context) {
    const suggestions = {
      ads: [
        "What's my overall ad performance this month?",
        "Which campaigns are spending the most money and are they worth it?",
        "Show me my cost per conversion and how to improve it",
        "Which keywords are performing best and which should I pause?",
        "How does my click-through rate compare and what can I optimize?"
      ],
      analytics: [
        "What's my website traffic performance this month?",
        "Which pages have the highest bounce rate?",
        "Show me user engagement trends and recommendations",
        "What are my top traffic sources?",
        "How can I improve my conversion rate?"
      ],
      intent: [
        "What are the trending keywords in my industry?",
        "Show me high-converting keyword opportunities",
        "Which keywords have low competition but high volume?",
        "What search intent patterns should I target?",
        "How can I optimize my keyword strategy?"
      ]
    };

    return suggestions[chatType] || suggestions.ads;
  }

  /**
   * Validate message before sending
   * @param {string} message - User message
   * @returns {object} Validation result
   */
  validateMessage(message) {
    if (!message || message.trim().length === 0) {
      return {
        valid: false,
        error: 'Message cannot be empty'
      };
    }

    if (message.length > 1000) {
      return {
        valid: false,
        error: 'Message is too long (max 1000 characters)'
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Generate session ID for tracking conversations
   * @returns {string} Unique session ID
   */
  generateSessionId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;