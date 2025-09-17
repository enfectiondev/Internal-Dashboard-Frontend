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

  // Generic cache key generator that works for both customerIds and propertyIds
  const getCacheKey = (id, period, endpoint, type = 'ads') => {
    return `${type}_${id}_${period}_${endpoint}`;
  };

  // Generic get from cache
  const getFromCache = (id, period, endpoint, type = 'ads') => {
    const key = getCacheKey(id, period, endpoint, type);
    const data = cache[key] || null;
    
    // Debug logging
    console.log(`[CACHE GET] Key: ${key}`);
    console.log(`[CACHE GET] Result:`, data ? 'HIT' : 'MISS');
    console.log(`[CACHE GET] All cache keys:`, Object.keys(cache));
    
    return data;
  };

  // Generic set cache
  const setCache = (id, period, endpoint, data, type = 'ads') => {
    const key = getCacheKey(id, period, endpoint, type);
    
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

  // Backward compatibility methods for Ads (customerIds)
  const getFromCacheAds = (customerId, period, endpoint) => {
    return getFromCache(customerId, period, endpoint, 'ads');
  };

  const setCacheAds = (customerId, period, endpoint, data) => {
    return setCache(customerId, period, endpoint, data, 'ads');
  };

  // New methods for Analytics (propertyIds)
  const getFromCacheAnalytics = (propertyId, period, endpoint) => {
    return getFromCache(propertyId, period, endpoint, 'analytics');
  };

  const setCacheAnalytics = (propertyId, period, endpoint, data) => {
    return setCache(propertyId, period, endpoint, data, 'analytics');
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
        if (key.startsWith(`ads_${customerId}_`)) {
          console.log(`[CACHE CLEAR] Removing key: ${key}`);
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  const clearCacheForProperty = (propertyId) => {
    console.log(`[CACHE CLEAR] Clearing cache for property: ${propertyId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`analytics_${propertyId}_`)) {
          console.log(`[CACHE CLEAR] Removing key: ${key}`);
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  const getCacheStats = () => {
    const keys = Object.keys(cache);
    const adsStats = {};
    const analyticsStats = {};
    
    keys.forEach(key => {
      const [type, id] = key.split('_');
      if (type === 'ads') {
        if (!adsStats[id]) adsStats[id] = 0;
        adsStats[id]++;
      } else if (type === 'analytics') {
        if (!analyticsStats[id]) analyticsStats[id] = 0;
        analyticsStats[id]++;
      }
    });
    
    return {
      totalKeys: keys.length,
      adsStats,
      analyticsStats,
      allKeys: keys
    };
  };

  return (
    <CacheContext.Provider value={{
      // Generic methods
      getFromCache,
      setCache,
      
      // Backward compatibility for Ads
      getFromCache: getFromCacheAds, // Default to ads for backward compatibility
      setCache: setCacheAds, // Default to ads for backward compatibility
      
      // Specific methods for Ads
      getFromCacheAds,
      setCacheAds,
      
      // Specific methods for Analytics
      getFromCacheAnalytics,
      setCacheAnalytics,
      
      // Clear methods
      clearCache,
      clearCacheForCustomer,
      clearCacheForProperty,
      getCacheStats
    }}>
      {children}
    </CacheContext.Provider>
  );
};