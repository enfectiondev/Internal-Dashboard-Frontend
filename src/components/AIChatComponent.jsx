import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const AIChatComponent = ({ 
  chatType, // 'ads', 'analytics', 'intent', 'metaads', 'facebook'
  activeCampaign, 
  activeProperty, 
  selectedAccount,
  selectedCampaigns, // For Meta Ads
  selectedPage, // For Facebook Analytics
  period,
  customDates
}) => {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [isSlowQuery, setIsSlowQuery] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Chat configuration based on type
  const chatConfig = {
    ads: {
      title: 'Campaign Agent',
      subtitle: 'Optimize your ad spend and boost campaign performance',
      color: '#508995',
      icon: '📊',
      suggestions: [
        "What's my overall ad performance this month?",
        "Which campaigns are spending the most money and are they worth it?",
        "Show me my cost per conversion and how to improve it",
        "Which keywords are performing best and which should I pause?",
        "How does my click-through rate compare and what can I optimize?"
      ]
    },
    analytics: {
      title: 'GA4 Agent',
      subtitle: 'Analyze user behavior and website performance insights',
      color: '#FF6B35',
      icon: '📈',
      suggestions: [
        "What's my website traffic performance this month?",
        "Which pages have the highest bounce rate?",
        "Show me user engagement trends and recommendations",
        "What are my top traffic sources?",
        "How can I improve my conversion rate?"
      ]
    },
    intent: {
      title: 'Intent Agent',
      subtitle: 'Discover keyword opportunities and search intent insights',
      color: '#9B59B6',
      icon: '🔍',
      suggestions: [
        "What are the trending keywords in my industry?",
        "Show me high-converting keyword opportunities",
        "Which keywords have low competition but high volume?",
        "What search intent patterns should I target?",
        "How can I optimize my keyword strategy?"
      ]
    },
    metaads: {
      title: 'Meta Ads Agent',
      subtitle: 'Optimize your Facebook and Instagram advertising campaigns',
      color: '#1877F2',
      icon: '📱',
      suggestions: [
        "What's my overall Meta ads performance across Facebook and Instagram?",
        "Which ad sets have the best ROAS and should get more budget?",
        "Show me my top performing audiences and lookalike segments",
        "Which creative formats are driving the most conversions?",
        "How can I improve my relevance score and reduce CPM?"
      ]
    },
    facebook: {
      title: 'Facebook Insights Agent',
      subtitle: 'Analyze your Facebook page and audience engagement',
      color: '#4267B2',
      icon: '👥',
      suggestions: [
        "What's my Facebook page growth and engagement rate this month?",
        "Which posts are generating the most reach and engagement?",
        "Show me my audience demographics and peak activity times",
        "What content types perform best with my followers?",
        "How can I improve my organic reach and engagement?"
      ]
    }
  };

  const currentConfig = chatConfig[chatType] || chatConfig.ads;


  // Helper function to get the correct token based on chat type
  const getAuthToken = (chatType) => {
    if (chatType === 'metaads' || chatType === 'facebook' || chatType === 'instagram') {
      return localStorage.getItem('facebook_token');
    }
    return localStorage.getItem('token'); // Google token for ads, analytics, intent
  };
  // Initialize chat with welcome message when chat is opened
  useEffect(() => {
    if (showChat && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hi! I'm your ${currentConfig.title}. I can help you analyze and optimize your ${
          chatType === 'ads' ? 'advertising campaigns' : 
          chatType === 'analytics' ? 'website analytics' : 
          chatType === 'intent' ? 'keyword strategy' :
          chatType === 'metaads' ? 'Meta advertising campaigns' :
          chatType === 'facebook' ? 'Facebook page performance' :
          'marketing efforts'
        }. What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [showChat, chatType]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (showChat) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showChat]);

  useEffect(() => {
    if (showChat) {
      loadHistoryData();
    }
  }, [showChat, chatType]);

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setCurrentSessionId(null); // Reset session ID to force new session
    
    // Re-initialize with welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hi! I'm your ${currentConfig.title}. I can help you analyze and optimize your ${
        chatType === 'ads' ? 'advertising campaigns' : 
        chatType === 'analytics' ? 'website analytics' : 
        chatType === 'intent' ? 'keyword strategy' :
        chatType === 'metaads' ? 'Meta advertising campaigns' :
        chatType === 'facebook' ? 'Facebook page performance' :
        'marketing efforts'
      }. What would you like to know?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
      if (!inputValue.trim() || isLoading) return;

      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: inputValue.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      const messageContent = inputValue.trim();  // ✅ Save message before clearing
      setInputValue('');
      setIsLoading(true);

      try {
        const apiResponse = await sendMessageToAPI(
          messageContent,  // ✅ Use saved message
          chatType, 
          activeCampaign, 
          activeProperty, 
          selectedAccount,
          selectedCampaigns,
          selectedPage,
          period,
          customDates
        );
        
        // Format and clean up the AI response
        let formattedResponse = apiResponse.response;
        
        // Clean up formatting
        formattedResponse = formattedResponse
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
          .replace(/### /g, '')              // Remove headers
          .trim();

        const aiResponse = {
          id: Date.now() + 1,
          type: 'ai',
          content: formattedResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
        
        // Update current session ID if provided
        if (apiResponse.session_id) {
          setCurrentSessionId(apiResponse.session_id);
        }
        
        // Refresh chat history
        loadHistoryData();
        
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Create user-friendly error message
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: error.message || "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsSlowQuery(false);  // ✅ ADD THIS - Reset slow query flag
      }
    };

  const loadHistoryData = async () => {
    try {
      const token = getAuthToken(chatType);
      const moduleType = chatType === 'ads' ? 'google_ads' : 
                        chatType === 'analytics' ? 'google_analytics' : 
                        chatType === 'intent' ? 'intent_insights' :
                        chatType === 'metaads' ? 'meta_ads' :
                        chatType === 'facebook' ? 'facebook_analytics' :
                        'google_ads';
      
      const response = await fetch(`https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/sessions/${moduleType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to load history: ${response.status}`);
        return;
      }

      const sessionsData = await response.json();
      console.log('Sessions data received:', sessionsData);
      
      // Transform the sessions data into recent chats format with proper titles
      const formattedChats = sessionsData.sessions?.map(session => {
        let titleMessage = 'New conversation';
        
        if (session.messages && session.messages.length > 0) {
          // Find the first user message for the title
          const firstUserMessage = session.messages.find(msg => msg.role === 'user');
          if (firstUserMessage && firstUserMessage.content && firstUserMessage.content.trim()) {
            const content = firstUserMessage.content.trim();
            titleMessage = content.length > 40 
              ? content.substring(0, 40) + '...'
              : content;
          }
        }
        
        return {
          id: session.session_id,
          title: titleMessage,
          timestamp: session.last_activity || session.created_at,
          messageCount: session.messages ? session.messages.length : 0
        };
      }).filter(chat => chat.messageCount > 0) || []; // Only show chats with messages
      
      console.log('Formatted chats:', formattedChats);
      setRecentChats(formattedChats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // API call functions
  const sendMessageToAPI = async (message, chatType, activeCampaign, activeProperty, selectedAccount, selectedCampaigns, selectedPage, period, customDates) => {
      const token = getAuthToken(chatType);
      
      console.log('🚀 [AIChatComponent] sendMessageToAPI called with:', {
        chatType,
        activeCampaign: activeCampaign?.name,
        activeProperty: activeProperty?.name,
        selectedAccount: selectedAccount?.name,
        selectedPage: selectedPage?.name,
        period,
        customDates,
        message
      });
      
      // Prepare context based on chat type
      let context = {
        token: token  // ✅ Always include token
      };
      let customerId = null;
      let propertyId = null;
      let accountId = null;
      let pageId = null;
      
      if (chatType === 'ads' && activeCampaign) {
        customerId = activeCampaign.customerId || activeCampaign.id;
        console.log('📊 [AIChatComponent] Google Ads - customerId:', customerId);
        context = {
          ...context,
          campaign_name: activeCampaign.name,
          campaign_id: activeCampaign.id,
          period: period
        };
      } else if (chatType === 'analytics' && activeProperty) {
        propertyId = activeProperty.id;
        console.log('📈 [AIChatComponent] Google Analytics - propertyId:', propertyId);
        context = {
          ...context,
          property_name: activeProperty.name,
          property_id: activeProperty.id,
          period: period
        };
      } else if (chatType === 'intent' && selectedAccount) {
        body = {
          message: message,
          module_type: 'intent_insights',
          session_id: currentSessionId,
          account_id: selectedAccount, // ✅ Pass the selected account ID
          period: period || 'LAST_30_DAYS',
          context: {
            account_id: selectedAccount,
            selectedAccount: selectedAccount
          }
        };      
      } else if (chatType === 'metaads' && selectedAccount) {
        accountId = selectedAccount.id || selectedAccount.account_id;
        console.log('📱 [AIChatComponent] Meta Ads - accountId:', accountId);
        context = {
          ...context,
          account_name: selectedAccount.name,
          account_id: accountId,
          currency: selectedAccount.currency,
          period: period
        };
        
        if (selectedCampaigns && selectedCampaigns.length > 0) {
          context.selected_campaigns = selectedCampaigns.map(c => ({
            id: c.id,
            name: c.name,
            status: c.status
          }));
        }
      } else if (chatType === 'facebook' && selectedPage) {
        pageId = selectedPage.id;
        console.log('👥 [AIChatComponent] Facebook - pageId:', pageId);
        context = {
          ...context,
          page_name: selectedPage.name,
          page_id: selectedPage.id,
          followers_count: selectedPage.followers_count,
          period: period
        };
      }
      
      // ✅ CRITICAL FIX: Only add custom dates to context if period is CUSTOM
      // This allows the backend to extract dates from the user's message
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        context.custom_dates = {
          startDate: customDates.startDate,  // Should be YYYY-MM-DD format
          endDate: customDates.endDate        // Should be YYYY-MM-DD format
        };
        console.log('📅 [AIChatComponent] Adding module filter custom dates to context:', context.custom_dates);
      } else {
        console.log('⚙️ [AIChatComponent] Period is not CUSTOM or no custom dates - backend will extract from message');
      }

      const payload = {
        message: message,
        module_type: chatType === 'ads' ? 'google_ads' : 
                    chatType === 'analytics' ? 'google_analytics' : 
                    chatType === 'intent' ? 'intent_insights' :
                    chatType === 'metaads' ? 'meta_ads' :
                    chatType === 'facebook' ? 'facebook_analytics' :
                    'google_ads',
        session_id: currentSessionId,
        customer_id: customerId,
        property_id: propertyId,
        account_id: accountId,
        page_id: pageId,
        period: period,  // This is the filter period (LAST_7_DAYS, LAST_30_DAYS, etc.)
        context: context
      };

      console.log('📦 [AIChatComponent] Final payload:', JSON.stringify(payload, null, 2));

      // ✅ Detect if this is likely a slow query
      const slowKeywords = [
        'all campaigns', 
        'every campaign', 
        'complete list', 
        'comprehensive', 
        'all active', 
        'total campaigns',
        'active campaigns',  // ✅ ADD THIS
        'show me campaigns', // ✅ ADD THIS
        'list campaigns',    // ✅ ADD THIS
        'campaigns over',    // ✅ ADD THIS - matches "campaigns over last 2 months"
        'all the campaigns'  // ✅ ADD THIS
      ];      
      const isLikelySlowQuery = slowKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      // Enhanced status updates with more detailed messages
      const statusUpdates = [
        "Received your question, analyzing...",
        "Understanding the context of your query...",
        "Identifying relevant data sources...",
        "Checking for existing data in your account...",
        "Fetching fresh analytics data...",
        "Processing and analyzing metrics...",
        "Generating insights and recommendations...",
        "Preparing your comprehensive answer..."
      ];
      
      // Special status updates for slow queries
      const slowQueryStatusUpdates = [
        "Analyzing your comprehensive data request...",
        "Connecting to data sources...",
        "Fetching campaign list from your account...",
        "Processing large dataset carefully...",
        "Respecting API rate limits to ensure data quality...",
        "Batch processing campaigns (this may take 2-5 minutes)...",
        "Still fetching data - please don't close this window...",
        "Almost there, finalizing comprehensive results...",
        "Preparing detailed insights for all campaigns..."
      ];
      
      let statusIndex = 0;
      let statusInterval;
      
      const startStatusUpdates = () => {
        setShowStatus(true);
        
        // ✅ Set slow query flag if detected
        if (isLikelySlowQuery) {
          setIsSlowQuery(true);
          setProcessingStatus(slowQueryStatusUpdates[0]);
        } else {
          setProcessingStatus(statusUpdates[0]);
        }
        
        statusIndex = 1;
        
        statusInterval = setInterval(() => {
          const updates = isLikelySlowQuery ? slowQueryStatusUpdates : statusUpdates;
          
          if (statusIndex < updates.length) {
            setProcessingStatus(updates[statusIndex]);
            statusIndex++;
          } else {
            // Cycle through final messages
            const finalMessages = isLikelySlowQuery ? [
              "Processing large dataset - almost there...",
              "Finalizing comprehensive campaign analysis...",
              "Preparing detailed insights (this takes time for quality)...",
              "Nearly complete - thank you for your patience..."
            ] : [
              "Almost there, finalizing results...",
              "Crunching the numbers...",
              "Preparing detailed insights..."
            ];
            const finalIndex = (statusIndex - updates.length) % finalMessages.length;
            setProcessingStatus(finalMessages[finalIndex]);
            statusIndex++;
          }
        }, isLikelySlowQuery ? 3000 : 2000); // Slower interval for slow queries
      };
      
      const stopStatusUpdates = () => {
        if (statusInterval) {
          clearInterval(statusInterval);
          statusInterval = null;
        }
        setShowStatus(false);
        setProcessingStatus('');
        setIsSlowQuery(false);
      };

      // ✅ Create AbortController for timeout handling
      const controller = new AbortController();
      const timeoutDuration = isLikelySlowQuery ? 300000 : 60000; // 5 minutes for slow queries, 1 minute for normal
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      try {
        startStatusUpdates();
        
        console.log(`⏱️ [AIChatComponent] Request timeout set to: ${timeoutDuration / 1000} seconds`);
        
        const response = await fetch('https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal  // ✅ Add abort signal
        });

        clearTimeout(timeoutId); // ✅ Clear timeout on success
        stopStatusUpdates();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `API Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Update session ID if provided
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
        }
        
        return data;
        
      } catch (error) {
        clearTimeout(timeoutId); // ✅ Clear timeout on error
        stopStatusUpdates();
        console.error('Error sending message:', error);
        
        let errorMessage = "I'm sorry, I encountered an error while processing your request.";
        
        // ✅ Handle AbortError (timeout)
        if (error.name === 'AbortError') {
          if (isLikelySlowQuery) {
            errorMessage = "⏱️ Your request is taking longer than expected. This usually happens when fetching comprehensive data for accounts with many campaigns (200+). The request may still be processing in the background. Please wait a moment and try asking your question again.";
          } else {
            errorMessage = "⏱️ The request timed out. This might be due to a large amount of data being processed. Please try again or ask for a more specific subset of data.";
          }
        } else if (error.message.includes('401')) {
          errorMessage = "🔐 Authentication error. Please try logging in again.";
        } else if (error.message.includes('403')) {
          errorMessage = "🚫 Access denied. Please check your permissions for this module.";
        } else if (error.message.includes('404')) {
          errorMessage = "❌ Service not found. Please try again later.";
        } else if (error.message.includes('500')) {
          errorMessage = "⚠️ Server error. Our team has been notified. Please try again in a few moments.";
        } else if (error.message.includes('timeout') || error.message.toLowerCase().includes('network')) {
          errorMessage = "🌐 Network timeout. For comprehensive data queries with 200+ campaigns, this may take up to 5 minutes. Please check your connection and try again.";
        }
        
        throw new Error(errorMessage);
      }
    };

  const handleDeleteConversation = async (sessionId) => {
    try {
      const token = getAuthToken(chatType);
      
      const response = await fetch('https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_ids: [sessionId]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      loadHistoryData();
      
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const loadSpecificConversation = async (sessionId) => {
    try {
      const token = getAuthToken(chatType);
      const moduleType = chatType === 'ads' ? 'google_ads' : 
                        chatType === 'analytics' ? 'google_analytics' : 
                        chatType === 'intent' ? 'intent_insights' :
                        chatType === 'metaads' ? 'meta_ads' :
                        chatType === 'facebook' ? 'facebook_analytics' :
                        'google_ads';
      
      console.log('Loading conversation:', sessionId, 'for module:', moduleType);
      
      const url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/conversation/${sessionId}?module_type=${moduleType}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load conversation:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Show user-friendly error
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: `Sorry, I couldn't load that conversation. Please try starting a new conversation.`,
          timestamp: new Date()
        }]);
        return;
      }

      const conversation = await response.json();
      console.log('Conversation loaded:', conversation);
      
      // Check if messages exist
      if (!conversation.messages || conversation.messages.length === 0) {
        console.warn('No messages found in conversation');
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: 'This conversation appears to be empty.',
          timestamp: new Date()
        }]);
        return;
      }
      
      // Convert conversation messages to display format
      const formattedMessages = conversation.messages.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
      console.log('Setting messages:', formattedMessages);
      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: `Sorry, I couldn't load that conversation. Error: ${error.message}`,
        timestamp: new Date()
      }]);
    }
  };

  const handleRecentChatClick = (sessionId) => {
    console.log('Chat clicked:', sessionId);
    loadSpecificConversation(sessionId);
  };

  // If chat is not shown, display the agent button
  if (!showChat) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm min-h-[500px] flex items-center justify-center">
        <div className="flex justify-center items-center h-full">
          <div
            className="p-2 rounded-lg border border-black"
            style={{ backgroundColor: "#75ACB8" }}
          >
            <button
              onClick={handleStartChat}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-[#0E4A57] transition-all duration-200 w-full hover:shadow-lg"
              style={{
                background: "linear-gradient(180deg, #FAF5F5 0%, #47DBFF 100%)",
              }}
            >
              <img
                src="/images/ai.png"
                alt="AI"
                className="w-7 h-7 object-contain"
              />
              <span>{currentConfig.title}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className={`transition-all duration-300 flex flex-col ${
          isSidebarCollapsed ? 'w-12' : 'w-64'
        }`} style={{ backgroundColor: '#f4f4f4' }}>
          {/* Sidebar Header */}
          <div className="p-4 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold" style={{ color: '#1A4752' }}>{currentConfig.title}</h2>
                <div className="flex items-center space-x-1 text-white px-2 py-1 rounded text-xs">
                  <span className="text-xs">AI</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title={isSidebarCollapsed ? "Expand" : "Collapse"}
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={16} style={{ color: '#508995' }} />
              ) : (
                <ChevronLeft size={16} style={{ color: '#508995' }} />
              )}
            </button>
          </div>

          {/* New Chat Button */}
          {!isSidebarCollapsed && (
            <div className="p-4">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center space-x-3 p-3 text-white rounded-lg transition-colors"
                style={{ backgroundColor: '#508995' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1A4752'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#508995'}
              >
                <Plus size={20} />
                <span>New Chat</span>
              </button>
            </div>
          )}

          {/* Recent Chats */}
          {!isSidebarCollapsed && (
            <div className="flex-1 px-4 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold mb-3 text-gray-800">Recents</h3>
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {recentChats.length > 0 ? (
                  recentChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                        chat.id === currentSessionId ? 'bg-gray-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-600 hover:text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecentChatClick(chat.id);
                      }}
                    >
                      <span className="text-sm truncate flex-1" title={chat.title}>{chat.title}</span>
                      <Trash2 
                        size={16} 
                        className="transition-opacity ml-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(chat.id);
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic">No recent conversations</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Header */}
          <div className="p-4 border-b" style={{ borderColor: '#9AB4BA' }}>
            <div className="text-center">
              <h1 className="text-xl font-bold mb-1" style={{ color: '#1A4752' }}>{currentConfig.title} Chat</h1>
              <p className="text-sm flex items-center justify-center space-x-1" style={{ color: '#508995' }}>
                <span className="text-yellow-500">💡</span>
                <span>{currentConfig.subtitle}</span>
              </p>
            </div>
          </div>

          {/* Context Info */}
          {(activeCampaign || activeProperty || selectedAccount || selectedPage) && (
            <div className="px-4 py-2 border-b" style={{ backgroundColor: '#9AB4BA', borderColor: '#58C3DB' }}>
              <div className="text-xs" style={{ color: '#1A4752' }}>
                <span className="font-medium">Context: </span>
                {chatType === 'ads' && activeCampaign && (
                  <span>{activeCampaign.name}</span>
                )}
                {chatType === 'analytics' && activeProperty && (
                  <span>{activeProperty.name}</span>
                )}
                {chatType === 'intent' && selectedAccount && (
                  <span>{selectedAccount.name || selectedAccount.descriptiveName}</span>
                )}
                {chatType === 'metaads' && selectedAccount && (
                  <span>{selectedAccount.name} ({selectedAccount.currency})</span>
                )}
                {chatType === 'facebook' && selectedPage && (
                  <span>{selectedPage.name} ({selectedPage.followers_count?.toLocaleString() || 0} followers)</span>
                )}
              </div>
            </div>
          )}

          {/* Suggestion Cards - Only show initially */}
          {messages.length <= 1 && (
            <div className="p-4 flex flex-col items-center">
              <div className="grid grid-cols-3 gap-3 mb-4 w-full max-w-4xl">
                {currentConfig.suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 bg-white rounded-lg text-center border-l-4 border text-gray-800 min-h-[80px] flex items-center justify-center cursor-pointer"
                    style={{ borderColor: currentConfig.color || '#508995' }}
                  >
                    <p className="text-xs leading-relaxed break-words">{suggestion}</p>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {currentConfig.suggestions.slice(3, 5).map((suggestion, index) => (
                  <button
                    key={index + 3}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 bg-white rounded-lg text-center border-l-4 border text-gray-800 min-h-[80px] flex items-center justify-center cursor-pointer"
                    style={{ borderColor: currentConfig.color || '#508995' }}
                  >
                    <p className="text-xs leading-relaxed break-words">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[80%] rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: message.type === 'user' ? '#508995' : '#9AB4BA',
                    color: message.type === 'user' ? 'white' : '#1A4752'
                  }}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Status Updates - Enhanced Display */}
            {showStatus && processingStatus && (
              <div className="flex justify-start">
                <div className={`border-l-4 rounded-lg px-4 py-3 max-w-[80%] shadow-sm ${
                  isSlowQuery 
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-500' 
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="relative w-5 h-5">
                      <div className={`absolute inset-0 border-4 rounded-full ${
                        isSlowQuery ? 'border-amber-200' : 'border-blue-200'
                      }`}></div>
                      <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${
                        isSlowQuery ? 'border-amber-600' : 'border-blue-600'
                      }`}></div>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${
                        isSlowQuery ? 'text-amber-900' : 'text-blue-900'
                      }`}>
                        {isSlowQuery ? 'Processing Large Dataset...' : 'Processing...'}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isSlowQuery ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {processingStatus}
                      </p>
                      {isSlowQuery && (
                        <p className="text-xs mt-1 text-amber-600 italic">
                          This may take 2-5 minutes for comprehensive data
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            


            {isLoading && !showStatus && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="How can I help you?"
                className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                style={{ backgroundColor: !inputValue.trim() || isLoading ? '#9AB4BA' : '#508995' }}
                onMouseEnter={(e) => {
                  if (!(!inputValue.trim() || isLoading)) e.target.style.backgroundColor = '#1A4752';
                }}
                onMouseLeave={(e) => {
                  if (!(!inputValue.trim() || isLoading)) e.target.style.backgroundColor = '#508995';
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium">Conversation deleted successfully</span>
            </div>
          </div>
        )}
      </div>
    </div>           
  );
};

export default AIChatComponent;