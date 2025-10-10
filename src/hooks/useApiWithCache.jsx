import React, { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext();

export const CacheProvider = ({ children }) => {
  const [cache, setCache] = useState({
    ads: {},      // Google Ads cache
    analytics: {}, // Google Analytics cache
    meta: {},     // Meta (Facebook/Instagram) cache
    facebook: {}, // Facebook cache
    instagram: {} // Instagram cache
  });

  // Generate a standardized cache key
  const generateCacheKey = (id, period, endpoint) => {
    // The period might be something like "LAST_7_DAYS" or "CUSTOM-2025-07-12-2025-10-08"
    return `${id}_${period}_${endpoint}`;
  };

  // Google Ads cache methods
  const getFromCacheAds = useCallback((customerId, period, endpoint) => {
    const key = generateCacheKey(customerId, period, endpoint);
    const cached = cache.ads[key];
    
    if (cached) {
      console.log(`[CACHE GET] Ads cache HIT for key: ${key}`);
      return cached;
    }
    
    console.log(`[CACHE GET] Ads cache MISS for key: ${key}`);
    console.log(`[CACHE GET] Available ads cache keys:`, Object.keys(cache.ads));
    return null;
  }, [cache.ads]);

  const setCacheAds = useCallback((customerId, period, endpoint, data) => {
    const key = generateCacheKey(customerId, period, endpoint);
    console.log(`[CACHE SET] Setting ads cache for key: ${key}`, data);
    
    setCache(prev => ({
      ...prev,
      ads: {
        ...prev.ads,
        [key]: data
      }
    }));
  }, []);

  // Google Analytics cache methods
  const getFromCacheAnalytics = useCallback((propertyId, period, endpoint) => {
    const key = generateCacheKey(propertyId, period, endpoint);
    const cached = cache.analytics[key];
    
    if (cached) {
      console.log(`[CACHE GET] Analytics cache HIT for key: ${key}`);
      return cached;
    }
    
    console.log(`[CACHE GET] Analytics cache MISS for key: ${key}`);
    console.log(`[CACHE GET] Available analytics cache keys:`, Object.keys(cache.analytics));
    return null;
  }, [cache.analytics]);

  const setCacheAnalytics = useCallback((propertyId, period, endpoint, data) => {
    const key = generateCacheKey(propertyId, period, endpoint);
    console.log(`[CACHE SET] Setting analytics cache for key: ${key}`, data);
    
    setCache(prev => ({
      ...prev,
      analytics: {
        ...prev.analytics,
        [key]: data
      }
    }));
  }, []);

  // Meta cache methods
  const getFromCacheMeta = useCallback((accountId, period, endpoint) => {
    const key = generateCacheKey(accountId, period, endpoint);
    const cached = cache.meta[key];
    
    if (cached) {
      console.log(`[CACHE GET] Meta cache HIT for key: ${key}`);
      return cached;
    }
    
    console.log(`[CACHE GET] Meta cache MISS for key: ${key}`);
    return null;
  }, [cache.meta]);

  const setCacheMeta = useCallback((accountId, period, endpoint, data) => {
    const key = generateCacheKey(accountId, period, endpoint);
    console.log(`[CACHE SET] Setting meta cache for key: ${key}`, data);
    
    setCache(prev => ({
      ...prev,
      meta: {
        ...prev.meta,
        [key]: data
      }
    }));
  }, []);

  // Facebook cache methods
  const getFromCacheFacebook = useCallback((pageId, period, endpoint) => {
    const key = generateCacheKey(pageId, period, endpoint);
    const cached = cache.facebook[key];
    
    if (cached) {
      console.log(`[CACHE GET] Facebook cache HIT for key: ${key}`);
      return cached;
    }
    
    console.log(`[CACHE GET] Facebook cache MISS for key: ${key}`);
    return null;
  }, [cache.facebook]);

  const setCacheFacebook = useCallback((pageId, period, endpoint, data) => {
    const key = generateCacheKey(pageId, period, endpoint);
    console.log(`[CACHE SET] Setting facebook cache for key: ${key}`, data);
    
    setCache(prev => ({
      ...prev,
      facebook: {
        ...prev.facebook,
        [key]: data
      }
    }));
  }, []);

  // Instagram cache methods
  const getFromCacheInstagram = useCallback((accountId, period, endpoint) => {
    const key = generateCacheKey(accountId, period, endpoint);
    const cached = cache.instagram[key];
    
    if (cached) {
      console.log(`[CACHE GET] Instagram cache HIT for key: ${key}`);
      return cached;
    }
    
    console.log(`[CACHE GET] Instagram cache MISS for key: ${key}`);
    return null;
  }, [cache.instagram]);

  const setCacheInstagram = useCallback((accountId, period, endpoint, data) => {
    const key = generateCacheKey(accountId, period, endpoint);
    console.log(`[CACHE SET] Setting instagram cache for key: ${key}`, data);
    
    setCache(prev => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        [key]: data
      }
    }));
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    console.log('[CACHE] Clearing all cache');
    setCache({
      ads: {},
      analytics: {},
      meta: {},
      facebook: {},
      instagram: {}
    });
  }, []);

  // Clear cache for a specific type
  const clearCacheByType = useCallback((type) => {
    console.log(`[CACHE] Clearing ${type} cache`);
    setCache(prev => ({
      ...prev,
      [type]: {}
    }));
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const stats = {
      ads: Object.keys(cache.ads).length,
      analytics: Object.keys(cache.analytics).length,
      meta: Object.keys(cache.meta).length,
      facebook: Object.keys(cache.facebook).length,
      instagram: Object.keys(cache.instagram).length,
      totalKeys: Object.keys(cache.ads).length + 
                 Object.keys(cache.analytics).length + 
                 Object.keys(cache.meta).length +
                 Object.keys(cache.facebook).length +
                 Object.keys(cache.instagram).length
    };
    
    console.log('[CACHE STATS]', stats);
    console.log('[CACHE STATS] Ads keys:', Object.keys(cache.ads));
    console.log('[CACHE STATS] Analytics keys:', Object.keys(cache.analytics));
    
    return stats;
  }, [cache]);

  // Get all cached data (for reporting)
  const getAllCachedData = useCallback(() => {
    return {
      ads: { ...cache.ads },
      analytics: { ...cache.analytics },
      meta: { ...cache.meta },
      facebook: { ...cache.facebook },
      instagram: { ...cache.instagram }
    };
  }, [cache]);

  const value = {
    // Ads methods
    getFromCacheAds,
    setCacheAds,
    
    // Analytics methods
    getFromCacheAnalytics,
    setCacheAnalytics,
    
    // Meta methods
    getFromCacheMeta,
    setCacheMeta,
    
    // Facebook methods
    getFromCacheFacebook,
    setCacheFacebook,
    
    // Instagram methods
    getFromCacheInstagram,
    setCacheInstagram,
    
    // Utility methods
    clearCache,
    clearCacheByType,
    getCacheStats,
    getAllCachedData
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

export default CacheContext;