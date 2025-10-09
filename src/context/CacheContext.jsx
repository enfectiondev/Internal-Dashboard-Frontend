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

  // Generic cache key generator
  const getCacheKey = (id, period, endpoint, type = 'ads') => {
    return `${type}_${id}_${period}_${endpoint}`;
  };

  // Generic get from cache
  const getFromCache = (id, period, endpoint, type = 'ads') => {
    const key = getCacheKey(id, period, endpoint, type);
    const data = cache[key] || null;
    
    console.log(`[CACHE GET] Key: ${key}`);
    console.log(`[CACHE GET] Result:`, data ? 'HIT' : 'MISS');
    
    return data;
  };

  // Direct cache access by key
  const getRawCacheData = (key) => {
    const data = cache[key] || null;
    console.log(`[RAW CACHE GET] Key: ${key}, Result: ${data ? 'HIT' : 'MISS'}`);
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
      
      setCacheState(prev => ({
        ...prev,
        [key]: data
      }));
    } else {
      console.log(`[CACHE SKIP] Not caching empty data for key: ${key}`);
    }
  };

  // Backward compatibility methods for Ads
  const getFromCacheAds = (customerId, period, endpoint) => {
    return getFromCache(customerId, period, endpoint, 'ads');
  };

  const setCacheAds = (customerId, period, endpoint, data) => {
    return setCache(customerId, period, endpoint, data, 'ads');
  };

  // Methods for Analytics
  const getFromCacheAnalytics = (propertyId, period, endpoint) => {
    return getFromCache(propertyId, period, endpoint, 'analytics');
  };

  const setCacheAnalytics = (propertyId, period, endpoint, data) => {
    return setCache(propertyId, period, endpoint, data, 'analytics');
  };

  // Methods for Meta Ads
  const getFromCacheMeta = (accountId, period, endpoint) => {
    return getFromCache(accountId, period, endpoint, 'meta');
  };

  const setCacheMeta = (accountId, period, endpoint, data) => {
    return setCache(accountId, period, endpoint, data, 'meta');
  };

  // Methods for Facebook
  const getFromCacheFacebook = (pageId, period, endpoint) => {
    return getFromCache(pageId, period, endpoint, 'facebook');
  };

  const setCacheFacebook = (pageId, period, endpoint, data) => {
    return setCache(pageId, period, endpoint, data, 'facebook');
  };

  // Clear all cache
  const clearCache = () => {
    console.log('[CACHE CLEAR] Clearing all cache');
    setCacheState({});
  };

  // Clear cache for specific customer
  const clearCacheForCustomer = (customerId) => {
    console.log(`[CACHE CLEAR] Clearing cache for customer: ${customerId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`ads_${customerId}_`)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  // Clear cache for specific property
  const clearCacheForProperty = (propertyId) => {
    console.log(`[CACHE CLEAR] Clearing cache for property: ${propertyId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`analytics_${propertyId}_`)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  // Clear cache for specific Meta account
  const clearCacheForMetaAccount = (accountId) => {
    console.log(`[CACHE CLEAR] Clearing cache for Meta account: ${accountId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`meta_${accountId}_`)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  // Clear cache for specific Facebook page
  const clearCacheForFacebookPage = (pageId) => {
    console.log(`[CACHE CLEAR] Clearing cache for Facebook page: ${pageId}`);
    setCacheState(prev => {
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.startsWith(`facebook_${pageId}_`)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  // Get cache statistics
  const getCacheStats = () => {
    const keys = Object.keys(cache);
    const stats = {
      ads: {},
      analytics: {},
      meta: {},
      facebook: {}
    };
    
    keys.forEach(key => {
      const [type, id] = key.split('_');
      if (stats[type]) {
        if (!stats[type][id]) stats[type][id] = 0;
        stats[type][id]++;
      }
    });
    
    return {
      totalKeys: keys.length,
      ...stats,
      allKeys: keys
    };
  };

  return (
    <CacheContext.Provider value={{
      // Generic methods
      getFromCache,
      setCache,
      getRawCacheData,
      
      // Ads methods
      getFromCacheAds,
      setCacheAds,
      clearCacheForCustomer,
      
      // Analytics methods
      getFromCacheAnalytics,
      setCacheAnalytics,
      clearCacheForProperty,
      
      // Meta Ads methods
      getFromCacheMeta,
      setCacheMeta,
      clearCacheForMetaAccount,
      
      // Facebook methods
      getFromCacheFacebook,
      setCacheFacebook,
      clearCacheForFacebookPage,
      
      // General methods
      clearCache,
      getCacheStats
    }}>
      {children}
    </CacheContext.Provider>
  );
};