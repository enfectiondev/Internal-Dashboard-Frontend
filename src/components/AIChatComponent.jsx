import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, ChevronRight, Plus, Trash2, TrendingUp, AlertCircle, CheckCircle, Target } from 'lucide-react';

const AIChatComponent = ({ 
  chatType,
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

  // Enhanced response formatter
  const formatAIResponse = (content) => {
    if (!content || typeof content !== 'string') {
      return <div className="text-sm">{content}</div>;
    }

    // Check if this looks like a structured analytics/ads response
    const hasMetrics = /(\d+[,\d]*|\$[\d,]+|[\d.]+%)/g.test(content);
    const hasInsights = /insights?:/i.test(content);
    const hasRecommendations = /recommendations?:/i.test(content);
    const hasPerformance = /(performance|metrics|data)/i.test(content);

    if (!hasMetrics && !hasInsights && !hasRecommendations && !hasPerformance) {
      // Simple text response
      return <div className="text-sm whitespace-pre-wrap">{content}</div>;
    }

    // Split content into sections
    const sections = content.split(/(?=###|##|\n\n(?=[A-Z][^:]*:))/);
    
    return (
      <div className="space-y-4">
        {sections.map((section, index) => {
          const trimmedSection = section.trim();
          if (!trimmedSection) return null;

          // Check section type
          if (trimmedSection.startsWith('###') || trimmedSection.startsWith('##')) {
            const title = trimmedSection.replace(/^#{2,3}\s*/, '').split('\n')[0];
            const content = trimmedSection.replace(/^#{2,3}[^\n]*\n/, '');
            
            return (
              <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4" style={{ borderColor: '#9AB4BA' }}>
                <h3 className="font-semibold text-sm mb-2" style={{ color: '#1A4752' }}>{title}</h3>
                {formatSectionContent(content)}
              </div>
            );
          }

          // Check for metrics/performance data
          if (/total|impressions|clicks|cost|conversions|ctr|cpc/i.test(trimmedSection)) {
            return (
              <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <TrendingUp size={16} className="text-blue-600 mr-2" />
                  <h3 className="font-semibold text-sm text-blue-800">Performance Metrics</h3>
                </div>
                {formatMetricsContent(trimmedSection)}
              </div>
            );
          }

          // Check for insights
          if (/insights?:/i.test(trimmedSection)) {
            return (
              <div key={index} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center mb-2">
                  <AlertCircle size={16} className="text-amber-600 mr-2" />
                  <h3 className="font-semibold text-sm text-amber-800">Key Insights</h3>
                </div>
                {formatInsightsContent(trimmedSection)}
              </div>
            );
          }

          // Check for recommendations
          if (/recommendations?:/i.test(trimmedSection)) {
            return (
              <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <Target size={16} className="text-green-600 mr-2" />
                  <h3 className="font-semibold text-sm text-green-800">Actionable Recommendations</h3>
                </div>
                {formatRecommendationsContent(trimmedSection)}
              </div>
            );
          }

          // Default formatting
          return (
            <div key={index} className="text-sm">
              {formatSectionContent(trimmedSection)}
            </div>
          );
        })}
      </div>
    );
  };

  const formatSectionContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Check for bullet points
          if (/^[-•*]\s/.test(trimmed)) {
            return (
              <div key={index} className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                <span className="text-sm">{trimmed.replace(/^[-•*]\s/, '')}</span>
              </div>
            );
          }

          // Check for numbered lists
          if (/^\d+\.\s/.test(trimmed)) {
            const number = trimmed.match(/^(\d+)\./)[1];
            const text = trimmed.replace(/^\d+\.\s/, '');
            return (
              <div key={index} className="flex items-start space-x-2">
                <span className="bg-gray-200 text-gray-700 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {number}
                </span>
                <span className="text-sm">{text}</span>
              </div>
            );
          }

          return <div key={index} className="text-sm">{trimmed}</div>;
        })}
      </div>
    );
  };

  const formatMetricsContent = (content) => {
    const metrics = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Extract metrics like "Total Impressions: 7,800"
      const metricMatch = trimmed.match(/^[-•*]?\s*\*?\*?([^:]+):\s*(.+)$/);
      if (metricMatch) {
        const [, label, value] = metricMatch;
        metrics.push({ label: label.trim(), value: value.trim() });
      }
    });

    if (metrics.length > 0) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="text-xs text-gray-600 mb-1">{metric.label}</div>
              <div className="font-semibold text-sm text-blue-800">{metric.value}</div>
            </div>
          ))}
        </div>
      );
    }

    return <div className="text-sm">{content}</div>;
  };

  const formatInsightsContent = (content) => {
    const cleanContent = content.replace(/^insights?:\s*/i, '');
    return formatSectionContent(cleanContent);
  };

  const formatRecommendationsContent = (content) => {
    const cleanContent = content.replace(/^(?:actionable\s+)?recommendations?:\s*/i, '');
    const lines = cleanContent.split('\n');
    
    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Check for numbered recommendations
          if (/^\d+\.\s/.test(trimmed)) {
            const text = trimmed.replace(/^\d+\.\s/, '');
            return (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{text}</span>
              </div>
            );
          }

          // Check for bullet points
          if (/^[-•*]\s/.test(trimmed)) {
            return (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-green-100">
                <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{trimmed.replace(/^[-•*]\s/, '')}</span>
              </div>
            );
          }

          return <div key={index} className="text-sm">{trimmed}</div>;
        })}
      </div>
    );
  };

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
    setCurrentSessionId(null);
    
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
      
      let formattedResponse = apiResponse.response;
      formattedResponse = formattedResponse
        .replace(/\\n\\n/g, '\n\n')
        .replace(/\\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/### /g, '### ')
        .trim();

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: formattedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      
      if (apiResponse.session_id) {
        setCurrentSessionId(apiResponse.session_id);
      }
      
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
        console.error(`Failed to load history: ${response.status}`);
        return;
      }

      const sessionsData = await response.json();
      
      const formattedChats = sessionsData.sessions?.map(session => {
        let titleMessage = 'New conversation';
        
        if (session.messages && session.messages.length > 0) {
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
      }).filter(chat => chat.messageCount > 0) || [];
      
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
  const sendMessageToAPI = async (message, chatType, activeCampaign, activeProperty, selectedAccount, period) => {
    const token = localStorage.getItem("token");
    
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
      session_id: currentSessionId,
      customer_id: customerId,
      property_id: propertyId,
      period: period,
      context: context
    };

    const statusUpdates = [
      "Message received, processing your question...",
      "AI agent is analyzing your request...",
      "Identifying relevant data sources...",
      "Searching for existing data in your account...",
      "Analyzing your marketing performance...",
      "Preparing insights and recommendations...",
      "Finalizing response..."
    ];
    
    let statusIndex = 0;
    let statusInterval;
    
    const startStatusUpdates = () => {
      setShowStatus(true);
      setProcessingStatus(statusUpdates[0]);
      statusIndex = 1;
      
      statusInterval = setInterval(() => {
        if (statusIndex < statusUpdates.length) {
          setProcessingStatus(statusUpdates[statusIndex]);
          statusIndex++;
        } else {
          const finalMessages = [
            "Almost ready...",
            "Analyzing final details...",
            "Preparing comprehensive response..."
          ];
          const finalIndex = (statusIndex - statusUpdates.length) % finalMessages.length;
          setProcessingStatus(finalMessages[finalIndex]);
          statusIndex++;
        }
      }, 1500);
    };
    
    const stopStatusUpdates = () => {
      if (statusInterval) {
        clearInterval(statusInterval);
        statusInterval = null;
      }
      setShowStatus(false);
      setProcessingStatus('');
    };

    try {
      startStatusUpdates();
      
      const response = await fetch('https://eyqi6vd53z.us-east-2.awsapprunner.com/api/chat/message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      stopStatusUpdates();

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.session_id) {
        setCurrentSessionId(data.session_id);
      }
      
      return data;
      
    } catch (error) {
      stopStatusUpdates();
      console.error('Error sending message:', error);
      
      let errorMessage = "I'm sorry, I encountered an error while processing your request.";
      
      if (error.message.includes('401')) {
        errorMessage = "Authentication error. Please try logging in again.";
      } else if (error.message.includes('403')) {
        errorMessage = "Access denied. Please check your permissions for this module.";
      } else if (error.message.includes('404')) {
        errorMessage = "Service not found. Please try again later.";
      } else if (error.message.includes('500')) {
        errorMessage = "Server error. Our team has been notified. Please try again in a few moments.";
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleDeleteConversation = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      
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
      const token = localStorage.getItem("token");
      const moduleType = chatType === 'ads' ? 'google_ads' : chatType === 'analytics' ? 'google_analytics' : 'intent_insights';
      
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
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: `Sorry, I couldn't load that conversation. Please try starting a new conversation.`,
          timestamp: new Date()
        }]);
        return;
      }

      const conversation = await response.json();
      
      if (!conversation.messages || conversation.messages.length === 0) {
        setMessages([{
          id: Date.now(),
          type: 'ai',
          content: 'This conversation appears to be empty.',
          timestamp: new Date()
        }]);
        return;
      }
      
      const formattedMessages = conversation.messages.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));
      
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
    loadSpecificConversation(sessionId);
  };

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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className={`transition-all duration-300 flex flex-col ${
          isSidebarCollapsed ? 'w-12' : 'w-64'
        }`} style={{ backgroundColor: '#f4f4f4' }}>
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
          <div className="p-4 border-b" style={{ borderColor: '#9AB4BA' }}>
            <div className="text-center">
              <h1 className="text-xl font-bold mb-1" style={{ color: '#1A4752' }}>{currentConfig.title} Chat</h1>
              <p className="text-sm flex items-center justify-center space-x-1" style={{ color: '#508995' }}>
                <span className="text-yellow-500">💡</span>
                <span>{currentConfig.subtitle}</span>
              </p>
            </div>
          </div>

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
                {message.type === 'user' ? (
                  <div
                    className="max-w-[80%] rounded-lg px-4 py-3"
                    style={{
                      backgroundColor: '#508995',
                      color: 'white'
                    }}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <p className="text-teal-100 text-xs mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded-lg px-4 py-4 bg-gray-50 border border-gray-200">
                    {formatAIResponse(message.content)}
                    <p className="text-gray-500 text-xs mt-3 pt-2 border-t border-gray-200">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Status Updates */}
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
   