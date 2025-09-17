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

export const useApiWithCache = (id, period, endpoint, apiCall, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Extract options
  const { 
    isAnalytics = false, 
    convertPeriod = false 
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
      if (!id || !period) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] No ${isAnalytics ? 'propertyId' : 'customerId'} or period provided`);
          setLoading(false);
          setData(null);
        }
        return;
      }

      // Convert period if needed (for analytics)
      const finalPeriod = convertPeriod ? convertPeriodToAnalytics(period) : period;
      const entityType = isAnalytics ? 'propertyId' : 'customerId';
      
      console.log(`[${endpoint}] Starting fetch for ${entityType}: ${id}, period: ${period} -> ${finalPeriod}`);
      
      // Log current cache stats
      const cacheStats = getCacheStats();
      console.log(`[${endpoint}] Current cache stats:`, cacheStats);

      // Check cache first using appropriate method
      const cachedData = isAnalytics 
        ? getFromCacheAnalytics(id, finalPeriod, endpoint)
        : getFromCacheAds(id, finalPeriod, endpoint);
        
      if (cachedData) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] Cache hit for ${id} - ${finalPeriod}`, cachedData);
          setData(cachedData);
          setLoading(false);
          setError(null);
        }
        return;
      }

      console.log(`[${endpoint}] Cache miss for ${id} - ${finalPeriod}, making API call`);

      // Create unique key for this API call
      const promiseKey = `${isAnalytics ? 'analytics' : 'ads'}_${id}_${finalPeriod}_${endpoint}`;
      
      // Check if this exact call is already in progress
      if (activePromises.has(promiseKey)) {
        console.log(`[${endpoint}] Using existing promise for ${id} - ${finalPeriod}`);
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
          console.log(`[${endpoint}] Making API call for ${id} - ${finalPeriod}`);
          const result = await memoizedApiCall(id, finalPeriod);
          
          console.log(`[${endpoint}] API response for ${id}:`, result);
          
          // Cache the result using appropriate method
          if (isAnalytics) {
            setCacheAnalytics(id, finalPeriod, endpoint, result);
          } else {
            setCacheAds(id, finalPeriod, endpoint, result);
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
  }, [id, period, endpoint, memoizedApiCall, isAnalytics, convertPeriod, getFromCacheAds, setCacheAds, getFromCacheAnalytics, setCacheAnalytics, getCacheStats]);

  // Log current state for debugging
  useEffect(() => {
    console.log(`[${endpoint}] State update - ${isAnalytics ? 'propertyId' : 'customerId'}: ${id}, loading: ${loading}, data:`, data, 'error:', error);
  }, [data, loading, error, id, endpoint, isAnalytics]);

  return { data, loading, error };
};