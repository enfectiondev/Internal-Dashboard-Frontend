import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';

const AIChatComponent = ({ 
  chatType, // 'ads', 'analytics', 'intent'
  activeCampaign, 
  activeProperty, 
  selectedAccount,
  period 
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
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
    }
  };

  const currentConfig = chatConfig[chatType] || chatConfig.ads;

  // Initialize chat with welcome message when chat is opened
  useEffect(() => {
    if (showChat && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai',
        content: `Hi! I'm your ${currentConfig.title}. I can help you analyze and optimize your ${chatType === 'ads' ? 'advertising campaigns' : chatType === 'analytics' ? 'website analytics' : 'keyword strategy'}. What would you like to know?`,
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

  const handleStartChat = () => {
    setShowChat(true);
  };

  useEffect(() => {
    if (showChat) {
      loadHistoryData();
      debugChatSessions();
      testConversationEndpoint();
    }
  }, [showChat, chatType]);

  const handleNewChat = () => {
    setMessages([]);
    setInputValue('');
    setCurrentSessionId(null); // ✅ CRITICAL: Reset session ID to force new session
    
    // Re-initialize with welcome message
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      content: `Hi! I'm your ${currentConfig.title}. I can help you analyze and optimize your ${chatType === 'ads' ? 'advertising campaigns' : chatType === 'analytics' ? 'website analytics' : 'keyword strategy'}. What would you like to know?`,
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
    setInputValue('');
    setIsLoading(true);

    try {
      const apiResponse = await sendMessageToAPI(
        userMessage.content, 
        chatType, 
        activeCampaign, 
        activeProperty, 
        selectedAccount, 
        period
      );
      
      // Format and clean up the AI response
      let formattedResponse = apiResponse.response;
      formattedResponse = formattedResponse
        .replace(/\\n\\n/g, '\n\n')
        .replace(/\\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/### /g, '')
        .trim();

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: formattedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Refresh chat history
      loadHistoryData();
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: error.message || "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      setIsLoadingHistory(true);
      // Use the sessions endpoint instead of history endpoint for more reliable data
      const token = localStorage.getItem("token");
      const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
      
      const response = await fetch(`https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/sessions/${moduleType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const sessionsData = await response.json();
      console.log('Raw sessions data:', sessionsData);
      
      // Transform the sessions data into recent chats format
      const formattedChats = sessionsData.sessions?.map(session => {
        console.log('Processing session:', session.session_id);
        
        // Get the first user message for the title (skip AI welcome messages)
        let titleMessage = 'New conversation';
        if (session.messages && session.messages.length > 0) {
          // Find the first user message or use the first message
          const firstUserMessage = session.messages.find(msg => msg.role === 'user');
          const messageToUse = firstUserMessage || session.messages[0];
          if (messageToUse && messageToUse.content) {
            titleMessage = messageToUse.content.substring(0, 30) + '...';
          }
        }
        
        return {
          id: session.session_id, // This should be the correct session ID
          title: titleMessage,
          timestamp: session.messages?.[0]?.timestamp || session.created_at
        };
      }) || [];
      
      console.log('Formatted chats:', formattedChats);
      setRecentChats(formattedChats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
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

  // Generate mock AI responses based on chat type
  const generateAIResponse = (userInput, type) => {
    const responses = {
      ads: [
        "Based on your campaign data, I can see that your cost per conversion has increased by 15% this month. Here are three key optimizations: 1) Pause underperforming keywords with high cost and low conversions, 2) Increase bids on your top-performing ad groups, 3) Test new ad copy variations to improve CTR.",
        "Your Google Ads performance shows strong potential. Your top campaign is generating excellent ROAS, but I notice some budget allocation opportunities. Would you like me to analyze your keyword performance in detail?",
        "I've analyzed your campaign metrics and found several optimization opportunities. Your impression share could be improved by increasing bids on high-converting keywords. Should I provide specific keyword recommendations?"
      ],
      analytics: [
        "Your website analytics show interesting user behavior patterns. The bounce rate on your landing pages is 12% above industry average, but your engagement time is strong. I recommend optimizing your page load speed and improving your call-to-action placement.",
        "Based on your GA4 data, your mobile users have 23% higher conversion rates than desktop users. This suggests you should allocate more marketing budget to mobile-focused campaigns. Would you like specific mobile optimization recommendations?",
        "Your traffic analysis reveals that organic search is your strongest performing channel with 4.2 pages per session. However, your direct traffic has low engagement. I can help you develop strategies to improve direct visitor experience."
      ],
      intent: [
        "I've identified several high-opportunity keywords in your industry. There are 15 keywords with high search volume and low competition that you're not currently targeting. These could drive an estimated 2,300 additional monthly visits.",
        "Your keyword analysis shows strong performance in branded terms, but there's untapped potential in long-tail keywords. I found 8 'buying intent' keywords with 40% less competition than your current targets.",
        "The search intent data reveals seasonal patterns in your target keywords. Peak search volume occurs in Q4, suggesting you should increase your keyword bids by 25% starting in October for maximum ROI."
      ]
    };
    
    const typeResponses = responses[type] || responses.ads;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  };

    // API call functions
  const sendMessageToAPI = async (message, chatType, activeCampaign, activeProperty, selectedAccount, period) => {
    const token = localStorage.getItem("token");
    
    // Prepare context based on chat type
    let context = {};
    let customerId = null;
    let propertyId = null;
    
    if (chatType === 'ads' && activeCampaign) {
      customerId = activeCampaign.customerId || activeCampaign.id;
      context = {
        campaign_name: activeCampaign.name,
        campaign_id: activeCampaign.id,
        period: period
      };
    } else if (chatType === 'analytics' && activeProperty) {
      propertyId = activeProperty.id;
      context = {
        property_name: activeProperty.name,
        property_id: activeProperty.id,
        period: period
      };
    } else if (chatType === 'intent' && selectedAccount) {
      customerId = selectedAccount.id || selectedAccount.customerId;
      context = {
        account_name: selectedAccount.name || selectedAccount.descriptiveName,
        account_id: selectedAccount.id || selectedAccount.customerId,
        period: period
      };
    }

    const payload = {
      message: message,
      module_type: chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights',
      session_id: currentSessionId, // Use existing session ID if available
      customer_id: customerId,
      property_id: propertyId,
      period: period,
      context: context
    };

    // Status updates with more realistic timing
    const statusUpdates = [
      "Message received, processing your question...",
      "AI agent is analyzing your request...",
      "Identifying relevant data sources...",
      "Searching for existing data in your account...",
      "Checking data availability for your time period...",
      "Fetching fresh data if needed...",
      "Analyzing your marketing performance...",
      "Preparing insights and recommendations...",
      "Finalizing response..."
    ];
    
    let statusIndex = 0;
    let statusInterval;
    
    // Start status updates
    const startStatusUpdates = () => {
      setShowStatus(true);
      setProcessingStatus(statusUpdates[0]);
      statusIndex = 1;
      
      statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length) {
          setProcessingStatus(statusUpdates[statusIndex]);
          statusIndex++;
        } else {
          // Cycle through final messages
          const finalMessages = [
            "Almost ready...",
            "Analyzing final details...",
            "Preparing comprehensive response..."
          ];
          const finalIndex = (statusIndex - statusUpdates.length) % finalMessages.length;
          setProcessingStatus(finalMessages[finalIndex]);
          statusIndex++;
        }
      }, 1500); // Slower updates for more realistic feel
    };
    
    // Stop status updates
    const stopStatusUpdates = () => {
      if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
      }
      setShowStatus(false);
      setProcessingStatus('');
    };

    try {
      // Start status updates
      startStatusUpdates();
      
      const response = await fetch('https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Stop status updates on completion
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
      // Stop status updates on error
      stopStatusUpdates();
      
      console.error('Error sending message:', error);
      
      // Provide more specific error messages
      let errorMessage = "I'm sorry, I encountered an error while processing your request.";
      
      if (error.message.includes('401')) {
        errorMessage = "Authentication error. Please try logging in again.";
      } else if (error.message.includes('403')) {
        errorMessage = "Access denied. Please check your permissions for this module.";
      } else if (error.message.includes('404')) {
        errorMessage = "Service not found. Please try again later.";
      } else if (error.message.includes('500')) {
        errorMessage = "Server error. Our team has been notified. Please try again in a few moments.";
      } else if (error.message.includes('Network')) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const loadChatHistory = async (chatType) => {
    const token = localStorage.getItem("token");
    const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
    
    const response = await fetch(`https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/history/${moduleType}?limit=15`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  };

  const debugChatSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
      
      const response = await fetch(`https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/sessions/${moduleType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const sessions = await response.json();
        console.log('Available sessions:', sessions);
      } else {
        console.error('Failed to get sessions:', response.status);
      }
    } catch (error) {
      console.error('Error getting sessions:', error);
    }
  };
  const deleteConversation = async (sessionIds) => {
    const token = localStorage.getItem("token");
    
    const response = await fetch('https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_ids: sessionIds
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  };

  // const handleRecentChatClick = (sessionId) => {
  //   if (!sessionId) {
  //     console.error('No session ID provided');
  //     return;
  //   }
    
  //   console.log('Loading conversation with session ID:', sessionId);
  //   loadSpecificConversation(sessionId);
  // };
  
  const testConversationEndpoint = async () => {
    try {
      const token = localStorage.getItem("token");
      const testSessionId = "8db9a4a1-b4b1-4fb5-b00b-07e89c030d4d"; // Use a real session ID from your debug
      const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
      
      // Test the test endpoint first
      const testUrl = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/test/${testSessionId}?module_type=${moduleType}`;
      console.log('Testing with URL:', testUrl);
      
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('Test endpoint result:', testResult);
      } else {
        console.error('Test endpoint failed:', testResponse.status);
      }
      
    } catch (error) {
      console.error('Test endpoint error:', error);
    }
  };

  const handleDeleteConversation = async (sessionId) => {
    try {
      await deleteConversation([sessionId]);
      
      // Show success notification
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      
      // Refresh the history after deletion
      loadHistoryData();
      
      // If the deleted conversation was the current one, reset
      if (sessionId === currentSessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Add this method to AIChatComponent
  const loadSpecificConversation = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
      
      console.log('=== LOADING CONVERSATION DEBUG ===');
      console.log('Session ID:', sessionId);
      console.log('Module Type:', moduleType);
      console.log('Chat Type:', chatType);
      
      const url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/conversation/${sessionId}?module_type=${moduleType}`;
      console.log('Full URL being called:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url
        });
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const conversation = await response.json();
      console.log('Conversation loaded successfully:', {
        sessionId: conversation.session_id,
        messageCount: conversation.messages?.length || 0,
        userEmail: conversation.user_email,
        moduleType: conversation.module_type
      });
      
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
      
      console.log('Formatted messages:', formattedMessages.length, 'messages');
      
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


  // Update the recent chats click handler
  const handleRecentChatClick = (sessionId) => {
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

  // Chat interface - embedded within the same container
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
        {/* Recent Chats */}
        {!isSidebarCollapsed && (
          <div className="flex-1 px-4 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Recents</h3>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {recentChats.length > 0 ? (
                recentChats.map((chat, index) => (
                  <div
                    key={chat.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group ${
                      chat.id === currentSessionId ? 'bg-gray-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-600 hover:text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Clicking on chat with ID:', chat.id);
                      handleRecentChatClick(chat.id);
                    }}
                  >
                    <span className="text-sm truncate flex-1">{chat.title}</span>
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
        {(activeCampaign || activeProperty || selectedAccount) && (
          <div className="px-4 py-2 border-b" style={{ backgroundColor: '#9AB4BA', borderColor: '#58C3DB' }}>
            <div className="text-xs" style={{ color: '#1A4752' }}>
              <span className="font-medium">Context: </span>
              {chatType === 'ads' && activeCampaign && (
                <span>{activeCampaign.name} • {period}</span>
              )}
              {chatType === 'analytics' && activeProperty && (
                <span>{activeProperty.name} • {period}</span>
              )}
              {chatType === 'intent' && selectedAccount && (
                <span>{selectedAccount.name || selectedAccount.descriptiveName} • {period}</span>
              )}
            </div>
          </div>
        )}

        {/* Suggestion Cards - Only show initially */}
        {messages.length <= 1 && (
          <div className="p-4 flex flex-col items-center">
            {/* First row - 3 columns */}
            <div className="grid grid-cols-3 gap-3 mb-4 w-full max-w-4xl">
              {currentConfig.suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-3 bg-white rounded-lg text-center border-l-4 border text-gray-800 min-h-[80px] flex items-center justify-center cursor-pointer"
                  style={{ borderColor: '#508995' }}
                >
                  <p className="text-xs leading-relaxed break-words">{suggestion}</p>
                </button>
              ))}
            </div>
            
            {/* Second row - 2 columns centered */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {currentConfig.suggestions.slice(3, 5).map((suggestion, index) => (
                <button
                  key={index + 3}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-3 bg-white rounded-lg text-center border-l-4 border text-gray-800 min-h-[80px] flex items-center justify-center cursor-pointer"
                  style={{ borderColor: '#508995' }}
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
          
          {/* Status Updates - Move this HERE */}
          {showStatus && processingStatus && (
            <div className="flex justify-start">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-blue-700 text-sm font-medium">{processingStatus}</p>
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
          



        {/* Input Area - Fixed at bottom */}
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
          <div 
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
            style={{
              animation: 'fadeIn 0.3s ease-out',
            }}
          >            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
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