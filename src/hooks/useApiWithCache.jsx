import { useState, useEffect, useRef, useCallback } from 'react';
import { useCache } from '../context/CacheContext';

// Global promise cache to prevent duplicate API calls
const activePromises = new Map();

export const useApiWithCache = (customerId, period, endpoint, apiCall) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getFromCache, setCache, getCacheStats } = useCache();
  const isMountedRef = useRef(true);

  // Memoize the API call to prevent infinite re-renders
  const memoizedApiCall = useCallback(apiCall, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId || !period) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] No customerId or period provided`);
          setLoading(false);
          setData(null);
        }
        return;
      }

      console.log(`[${endpoint}] Starting fetch for customerId: ${customerId}, period: ${period}`);
      
      // Log current cache stats
      const cacheStats = getCacheStats();
      console.log(`[${endpoint}] Current cache stats:`, cacheStats);

      // Check cache first
      const cachedData = getFromCache(customerId, period, endpoint);
      if (cachedData) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] Cache hit for ${customerId} - ${period}`, cachedData);
          setData(cachedData);
          setLoading(false);
          setError(null);
        }
        return;
      }

      console.log(`[${endpoint}] Cache miss for ${customerId} - ${period}, making API call`);

      // Create unique key for this API call
      const promiseKey = `${customerId}_${period}_${endpoint}`;
      
      // Check if this exact call is already in progress
      if (activePromises.has(promiseKey)) {
        console.log(`[${endpoint}] Using existing promise for ${customerId} - ${period}`);
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
          console.log(`[${endpoint}] Making API call for ${customerId} - ${period}`);
          const result = await memoizedApiCall(customerId, period);
          
          console.log(`[${endpoint}] API response for ${customerId}:`, result);
          
          // Cache the result (setCache will decide whether to actually cache it)
          setCache(customerId, period, endpoint, result);
          
          return result;
        } catch (apiError) {
          console.error(`[${endpoint}] API error for ${customerId}:`, apiError);
          throw apiError;
        } finally {
          activePromises.delete(promiseKey);
          console.log(`[${endpoint}] Removed promise from active promises for ${customerId}`);
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
          console.log(`[${endpoint}] Setting data for ${customerId}:`, result);
          setData(result);
          setError(null);
        }
      } catch (err) {
        console.error(`[${endpoint}] Final error handling for ${customerId}:`, err);
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
  }, [customerId, period, endpoint, memoizedApiCall, getFromCache, setCache, getCacheStats]);

  // Log current state for debugging
  useEffect(() => {
    console.log(`[${endpoint}] State update - customerId: ${customerId}, loading: ${loading}, data:`, data, 'error:', error);
  }, [data, loading, error, customerId, endpoint]);

  return { data, loading, error };
};