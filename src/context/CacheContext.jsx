import React, { createContext, useContext, useState } from 'react';

const CacheContext = createContext();

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

export const CacheProvider = ({ children }) => {
  const [cache, setCacheState] = useState({});

  const getCacheKey = (customerId, period, endpoint) => {
    return `${customerId}_${period}_${endpoint}`;
  };

  const getFromCache = (customerId, period, endpoint) => {
    const key = getCacheKey(customerId, period, endpoint);
    const data = cache[key] || null;
    
    // Debug logging
    console.log(`[CACHE GET] Key: ${key}`);
    console.log(`[CACHE GET] Result:`, data ? 'HIT' : 'MISS');
    console.log(`[CACHE GET] All cache keys:`, Object.keys(cache));
    
    return data;
  };

  const setCache = (customerId, period, endpoint, data) => {
    const key = getCacheKey(customerId, period, endpoint);
    
    // Only cache if we have meaningful data
    const shouldCache = data && (
      Array.isArray(data) ? data.length > 0 : 
      typeof data === 'object' ? Object.keys(data).length > 0 :
      true
    );

    if (shouldCache) {
      console.log(`[CACHE SET] Key: ${key}`);
      console.log(`[CACHE SET] Data:`, data);
      
      setCacheState(prev => ({
        ...prev,
        [key]: data
      }));
    } else {
      console.log(`[CACHE SKIP] Not caching empty data for key: ${key}`);
    }
  };

  const clearCache = () => {
    console.log('[CACHE CLEAR] Clearing all cache');
    setCacheState({});
  };

  const clearCacheForCustomer = (customerId) => {
    console.log(`[CACHE CLEAR] Clearing cache for customer: ${customerId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`${customerId}_`)) {
          console.log(`[CACHE CLEAR] Removing key: ${key}`);
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  const getCacheStats = () => {
    const keys = Object.keys(cache);
    const stats = {};
    
    keys.forEach(key => {
      const [customerId] = key.split('_');
      if (!stats[customerId]) {
        stats[customerId] = 0;
      }
      stats[customerId]++;
    });
    
    return {
      totalKeys: keys.length,
      customerStats: stats,
      allKeys: keys
    };
  };

  return (
    <CacheContext.Provider value={{
      getFromCache,
      setCache,
      clearCache,
      clearCacheForCustomer,
      getCacheStats
    }}>
      {children}
    </CacheContext.Provider>
  );
};