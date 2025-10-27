import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronLeft, ChevronRight, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';

const AIChatComponent = ({ 
  chatType, // 'ads', 'analytics', 'intent', 'metaads', 'facebook', 'instagram'
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
  
  // LangGraph specific states
  const [needsUserInput, setNeedsUserInput] = useState(false);
  const [clarificationPrompt, setClarificationPrompt] = useState('');
  const [selectionOptions, setSelectionOptions] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Chat configuration based on type
  const chatConfig = {
    ads: {
      title: 'Google Ads Agent',
      subtitle: 'Optimize your ad spend and boost campaign performance',
      color: '#508995',
      icon: '📊',
      moduleType: 'google_ads',
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
      moduleType: 'google_analytics',
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
      moduleType: 'intent_insights',
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
      moduleType: 'meta_ads',
      suggestions: [
        "What's my overall Meta ads performance?",
        "Which ad sets have the best ROAS and should get more budget?",
        "Show me my top performing audiences",
        "Which creative formats are driving the most conversions?",
        "How can I improve my relevance score and reduce CPM?"
      ]
    },
    facebook: {
      title: 'Facebook Insights Agent',
      subtitle: 'Analyze your Facebook page and audience engagement',
      color: '#4267B2',
      icon: '👥',
      moduleType: 'facebook',
      suggestions: [
        "What's my Facebook page growth and engagement rate?",
        "Which posts are generating the most reach?",
        "Show me my audience demographics",
        "What content types perform best?",
        "How can I improve my organic reach?"
      ]
    },
    instagram: {
      title: 'Instagram Insights Agent',
      subtitle: 'Track your Instagram performance and audience engagement',
      color: '#E4405F',
      icon: '📸',
      moduleType: 'instagram',
      suggestions: [
        "What's my Instagram engagement rate this month?",
        "Which posts got the most likes and comments?",
        "Show me my audience growth trends",
        "What are my best performing hashtags?",
        "How can I increase my reach?"
      ]
    }
  };

  const currentConfig = chatConfig[chatType] || chatConfig.ads;

  // Helper function to get the correct token based on chat type
  const getAuthToken = (chatType) => {
    if (chatType === 'metaads' || chatType === 'facebook' || chatType === 'instagram') {
      return localStorage.getItem('facebook_token');
    }
    return localStorage.getItem('token'); // Google token
  };

  // Initialize chat with welcome message
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
          chatType === 'instagram' ? 'Instagram profile' :
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

  // Load chat history
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
    setNeedsUserInput(false);
    setClarificationPrompt('');
    setSelectionOptions(null);
    setSelectedItems([]);
    
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
        chatType === 'instagram' ? 'Instagram profile' :
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
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setShowStatus(true);
    setProcessingStatus('Analyzing your question...');

    try {
      const response = await sendMessageToAPI(messageContent);
      
      // Handle response
      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.response,
          timestamp: new Date(),
          visualizations: response.visualizations,
          endpoints: response.triggered_endpoints
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Check if user input is needed
        if (response.needs_user_input) {
          handleNeedsUserInput(response);
        }
        
        // Update session ID
        if (response.session_id) {
          setCurrentSessionId(response.session_id);
        }
        
        // Reload history to show new conversation
        loadHistoryData();
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShowStatus(false);
      setProcessingStatus('');
      setIsSlowQuery(false);
    }
  };

  const sendMessageToAPI = async (messageContent) => {
    const token = getAuthToken(chatType);
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Build request payload based on module type
    const payload = {
      message: messageContent,
      module_type: currentConfig.moduleType,
      session_id: currentSessionId,
      context: buildContextData(),
      period: period,
      ...(period === 'CUSTOM' && customDates && {
        start_date: customDates.startDate,
        end_date: customDates.endDate
      })
    };

    // Add module-specific IDs
    if (chatType === 'ads' && activeCampaign) {
      payload.customer_id = activeCampaign.customerId || activeCampaign.id;
    } else if (chatType === 'analytics' && activeProperty) {
      payload.property_id = activeProperty.id;
    } else if (chatType === 'intent' && selectedAccount) {
      payload.customer_id = selectedAccount.customerId || selectedAccount.id;
    } else if (chatType === 'metaads' && selectedAccount) {
      payload.context = {
        ...payload.context,
        account_id: selectedAccount.account_id,
        ad_account_id: selectedAccount.account_id
      };
    } else if (chatType === 'facebook' && selectedPage) {
      payload.context = {
        ...payload.context,
        page_id: selectedPage.id
      };
    } else if (chatType === 'instagram' && selectedAccount) {
      payload.context = {
        ...payload.context,
        account_id: selectedAccount.id,
        instagram_account_id: selectedAccount.id
      };
    }

    console.log('📤 Sending to API:', payload);

    // Set slow query warning after 5 seconds
    const slowQueryTimer = setTimeout(() => {
      setIsSlowQuery(true);
      setProcessingStatus('Processing large dataset - this may take 2-5 minutes...');
    }, 5000);

    try {
      const response = await fetch('https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      clearTimeout(slowQueryTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 API Response:', data);

      return {
        success: true,
        response: data.response,
        session_id: data.session_id,
        triggered_endpoints: data.endpoint_data?.triggered_endpoints || [],
        visualizations: data.endpoint_data?.visualizations,
        needs_user_input: data.endpoint_data?.requires_selection ? true : false,
        selection_data: data.endpoint_data?.requires_selection
      };

    } catch (error) {
      clearTimeout(slowQueryTimer);
      console.error('❌ API Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const buildContextData = () => {
    const context = {};
    
    // Add account/property information
    if (chatType === 'ads' && activeCampaign) {
      context.customer_id = activeCampaign.customerId || activeCampaign.id;
      context.customer_name = activeCampaign.name;
    } else if (chatType === 'analytics' && activeProperty) {
      context.property_id = activeProperty.id;
      context.property_name = activeProperty.name;
    } else if (chatType === 'intent' && selectedAccount) {
      context.account_id = selectedAccount.customerId || selectedAccount.id;
      context.account_name = selectedAccount.name || selectedAccount.descriptiveName;
    } else if (chatType === 'metaads' && selectedAccount) {
      context.account_id = selectedAccount.account_id;
      context.account_name = selectedAccount.name;
      context.currency = selectedAccount.currency;
    } else if (chatType === 'facebook' && selectedPage) {
      context.page_id = selectedPage.id;
      context.page_name = selectedPage.name;
    } else if (chatType === 'instagram' && selectedAccount) {
      context.account_id = selectedAccount.id;
      context.account_name = selectedAccount.name;
    }

    return context;
  };

  const handleNeedsUserInput = (response) => {
    if (!response.selection_data) return;

    const { type, options, prompt } = response.selection_data;
    
    setNeedsUserInput(true);
    setClarificationPrompt(prompt);
    setSelectionOptions({
      type: type,
      options: options
    });
    setSelectedItems([]);

    // Add clarification message
    const clarificationMessage = {
      id: Date.now() + 2,
      type: 'ai',
      content: prompt,
      timestamp: new Date(),
      requiresSelection: true
    };
    setMessages(prev => [...prev, clarificationMessage]);
  };

  const handleSelectionSubmit = () => {
    if (selectedItems.length === 0) return;

    // Send selected items back to continue the conversation
    const selectionMessage = `I've selected: ${selectedItems.map(id => {
      const option = selectionOptions.options.find(opt => opt.id === id);
      return option?.name || id;
    }).join(', ')}`;

    setInputValue(selectionMessage);
    setNeedsUserInput(false);
    setSelectionOptions(null);
    
    // Submit the selection
    handleSendMessage();
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const loadHistoryData = async () => {
    try {
      const token = getAuthToken(chatType);
      
      const response = await fetch(
        `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/chat/sessions/${currentConfig.moduleType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📚 Loaded history:', data);
        
        // Transform sessions data to match UI format
        const formattedChats = data.sessions?.map(session => {
          let titleMessage = 'New conversation';
          
          if (session.preview || session.user_question) {
            const content = (session.preview || session.user_question).trim();
            titleMessage = content.length > 40 ? content.substring(0, 40) + '...' : content;
          } else if (session.messages && session.messages.length > 0) {
            const firstUserMessage = session.messages.find(msg => msg.role === 'user');
            if (firstUserMessage && firstUserMessage.content) {
              const content = firstUserMessage.content.trim();
              titleMessage = content.length > 40 ? content.substring(0, 40) + '...' : content;
            }
          }
          
          return {
            id: session.session_id,
            title: titleMessage,
            timestamp: session.timestamp || session.last_activity || session.created_at,
            messageCount: session.messages ? session.messages.length : (session.message_count || 0)
          };
        }).filter(chat => chat.messageCount > 0) || [];
        
        setRecentChats(formattedChats);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const loadConversation = async (sessionId) => {
    try {
      const token = getAuthToken(chatType);
      
      const response = await fetch(
        `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/chat/conversation/${sessionId}?module_type=${currentConfig.moduleType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📖 Loaded conversation:', data);
        
        // Convert conversation to messages format
        const loadedMessages = data.messages.map((msg, index) => ({
          id: Date.now() + index,
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          visualizations: msg.visualizations,
          endpoints: msg.triggered_endpoints
        }));
        
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const deleteConversation = async (sessionId) => {
    try {
      const token = getAuthToken(chatType);
      
      const response = await fetch(
        'https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/chat/delete',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            session_ids: [sessionId]
          })
        }
      );

      if (response.ok) {
        loadHistoryData(); // Reload to update list
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        
        // If we're viewing this conversation, start a new chat
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleRecentChatClick = (sessionId) => {
    console.log('Chat clicked:', sessionId);
    loadConversation(sessionId);
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
                          deleteConversation(chat.id);
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
                {chatType === 'instagram' && selectedAccount && (
                  <span>{selectedAccount.name}</span>
                )}
              </div>
            </div>
          )}

          {/* Suggestion Cards - Only show initially */}
          {messages.length <= 1 && !needsUserInput && (
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
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${message.isError ? 'border-2 border-red-300' : ''}`}
                  style={{
                    backgroundColor: message.type === 'user' ? '#508995' : '#9AB4BA',
                    color: message.type === 'user' ? 'white' : '#1A4752'
                  }}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  
                  {/* Show endpoints if available */}
                  {message.endpoints && message.endpoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs opacity-75 mb-1">Data sources used:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.endpoints.map((endpoint, idx) => (
                          <span key={idx} className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">
                            {endpoint}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-teal-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Selection UI for Meta Ads hierarchy */}
            {needsUserInput && selectionOptions && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start space-x-2 mb-3">
                  <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Selection Required</p>
                    <p className="text-sm text-blue-700">{clarificationPrompt}</p>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                  {selectionOptions.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(option.id)
                          ? 'bg-blue-100 border-2 border-blue-400'
                          : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(option.id)}
                        onChange={() => toggleItemSelection(option.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{option.name}</p>
                        {option.status && (
                          <p className="text-xs text-gray-500">Status: {option.status}</p>
                        )}
                        {option.objective && (
                          <p className="text-xs text-gray-500">Objective: {option.objective}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                
                <button
                  onClick={handleSelectionSubmit}
                  disabled={selectedItems.length === 0}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Continue with {selectedItems.length} selected
                </button>
              </div>
            )}

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
                placeholder={needsUserInput ? "Please make a selection above..." : "How can I help you?"}
                className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                disabled={isLoading || needsUserInput}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || needsUserInput}
                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                style={{ backgroundColor: !inputValue.trim() || isLoading || needsUserInput ? '#9AB4BA' : '#508995' }}
                onMouseEnter={(e) => {
                  if (!(!inputValue.trim() || isLoading || needsUserInput)) e.target.style.backgroundColor = '#1A4752';
                }}
                onMouseLeave={(e) => {
                  if (!(!inputValue.trim() || isLoading || needsUserInput)) e.target.style.backgroundColor = '#508995';
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