import { useState, useCallback } from 'react';

/**
 * Custom hook for managing AI chat state
 * @param {string} chatType - Type of chat ('ads', 'analytics', 'intent')
 * @returns {object} Chat state and handlers
 */
export const useChatState = (chatType) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const openChat = useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setLoadingState = useCallback((loading) => {
    setIsLoading(loading);
  }, []);

  return {
    isChatOpen,
    messages,
    isLoading,
    openChat,
    closeChat,
    addMessage,
    clearMessages,
    setLoadingState,
    setMessages
  };
};