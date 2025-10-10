import { useState, useEffect, useRef, useCallback } from 'react';
import { useCache } from '../context/CacheContext';

// Global promise cache to prevent duplicate API calls
const activePromises = new Map();

// Convert dashboard period to analytics API period format
const convertPeriodToAnalytics = (period) => {
  const periodMap = {
    'LAST_7_DAYS': '7d',
    'LAST_30_DAYS': '30d', 
    'LAST_3_MONTHS': '90d',
    'LAST_1_YEAR': '365d'
  };
  return periodMap[period] || '7d';
};

export const useApiWithCache = (id, periodOrCacheKey, endpoint, apiCall, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract options
  const { 
    isAnalytics = false, 
    convertPeriod = false,
    customDates = null // NEW: Support custom dates
  } = options;
  
  // Use appropriate cache methods based on type
  const { 
    getFromCacheAds, 
    setCacheAds, 
    getFromCacheAnalytics, 
    setCacheAnalytics, 
    getCacheStats 
  } = useCache();
  
  const isMountedRef = useRef(true);

  // Memoize the API call to prevent infinite re-renders
  const memoizedApiCall = useCallback(apiCall, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !periodOrCacheKey) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] No ${isAnalytics ? 'propertyId' : 'customerId'} or period provided`);
          setLoading(false);
          setData(null);
        }
        return;
      }

      // CRITICAL: Reset state when period changes to show loading
      if (isMountedRef.current) {
        setLoading(true);
        setError(null);
      }

      // Create cache key that includes custom dates if provided
      let cacheKey = periodOrCacheKey;
      if (periodOrCacheKey === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        cacheKey = `CUSTOM-${customDates.startDate}-${customDates.endDate}`;
      }
      
      // Convert period if needed (for analytics) - only convert if it's a standard period
      const finalPeriod = convertPeriod && !cacheKey.includes('-') 
        ? convertPeriodToAnalytics(cacheKey) 
        : cacheKey;
      
      const entityType = isAnalytics ? 'propertyId' : 'customerId';
      
      console.log(`[${endpoint}] Starting fetch for ${entityType}: ${id}, period: ${periodOrCacheKey} -> ${finalPeriod}`);
      
      // Log current cache stats
      const cacheStats = getCacheStats();
      console.log(`[${endpoint}] Current cache stats:`, cacheStats);

      // Check cache first using appropriate method with the cache key
      const cachedData = isAnalytics 
        ? getFromCacheAnalytics(id, cacheKey, endpoint)
        : getFromCacheAds(id, cacheKey, endpoint);
        
      if (cachedData) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] Cache hit for ${id} - ${cacheKey}`, cachedData);
          setData(cachedData);
          setLoading(false);
          setError(null);
        }
        return;
      }

      console.log(`[${endpoint}] Cache miss for ${id} - ${cacheKey}, making API call`);

      // Create unique key for this API call using the cache key
      const promiseKey = `${isAnalytics ? 'analytics' : 'ads'}_${id}_${cacheKey}_${endpoint}`;
      
      // Check if this exact call is already in progress
      if (activePromises.has(promiseKey)) {
        console.log(`[${endpoint}] Using existing promise for ${id} - ${cacheKey}`);
        try {
          const result = await activePromises.get(promiseKey);
          if (isMountedRef.current) {
            setData(result);
            setLoading(false);
            setError(null);
          }
        } catch (err) {
          if (isMountedRef.current) {
            setError(err);
            setData(null);
            setLoading(false);
          }
        }
        return;
      }

      // Create new API call promise
      const apiPromise = (async () => {
        try {
          console.log(`[${endpoint}] Making API call for ${id} - ${cacheKey}`);
          // Pass both the period and custom dates to the API call function
          const result = await memoizedApiCall(id, periodOrCacheKey, customDates);
          
          console.log(`[${endpoint}] API response for ${id}:`, result);
          
          // Cache the result using appropriate method with the cache key
          if (isAnalytics) {
            setCacheAnalytics(id, cacheKey, endpoint, result);
          } else {
            setCacheAds(id, cacheKey, endpoint, result);
          }
          
          return result;
        } catch (apiError) {
          console.error(`[${endpoint}] API error for ${id}:`, apiError);
          throw apiError;
        } finally {
          activePromises.delete(promiseKey);
          console.log(`[${endpoint}] Removed promise from active promises for ${id}`);
        }
      })();

      // Store the promise
      activePromises.set(promiseKey, apiPromise);

      // Wait for result
      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }
        
        const result = await apiPromise;
        
        if (isMountedRef.current) {
          console.log(`[${endpoint}] Setting data for ${id}:`, result);
          setData(result);
          setError(null);
        }
      } catch (err) {
        console.error(`[${endpoint}] Final error handling for ${id}:`, err);
        if (isMountedRef.current) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [id, periodOrCacheKey, endpoint, memoizedApiCall, isAnalytics, convertPeriod, customDates, getFromCacheAds, setCacheAds, getFromCacheAnalytics, setCacheAnalytics, getCacheStats]);

  // Log current state for debugging
  useEffect(() => {
    console.log(`[${endpoint}] State update - ${isAnalytics ? 'propertyId' : 'customerId'}: ${id}, loading: ${loading}, data:`, data, 'error:', error);
  }, [data, loading, error, id, endpoint, isAnalytics]);

  return { data, loading, error };
};