import { useState, useEffect, useRef, useCallback } from 'react';
import { useCache } from '../context/CacheContext';

const activePromises = new Map();

export const useMetaApi = (accountId, period, customDates, endpoint, apiCall) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { getFromCacheMeta, setCacheMeta } = useCache();
  const isMountedRef = useRef(true);
  const memoizedApiCall = useCallback(apiCall, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!accountId || !period) {
        if (isMountedRef.current) {
          setLoading(false);
          setData(null);
        }
        return;
      }

      // Create cache key based on period type
      let cacheKey = period;
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        cacheKey = `${customDates.startDate}_${customDates.endDate}`;
      }

      console.log(`[${endpoint}] Checking cache for Meta account: ${accountId}, period: ${cacheKey}`);
      
      const cachedData = getFromCacheMeta(accountId, cacheKey, endpoint);
      if (cachedData) {
        if (isMountedRef.current) {
          console.log(`[${endpoint}] Cache hit for ${accountId}`, cachedData);
          setData(cachedData);
          setLoading(false);
          setError(null);
        }
        return;
      }

      console.log(`[${endpoint}] Cache miss, making API call`);

      const promiseKey = `meta_${accountId}_${cacheKey}_${endpoint}`;
      
      if (activePromises.has(promiseKey)) {
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

      const apiPromise = (async () => {
        try {
          const result = await memoizedApiCall(accountId, period, customDates);
          setCacheMeta(accountId, cacheKey, endpoint, result);
          return result;
        } catch (apiError) {
          console.error(`[${endpoint}] API error:`, apiError);
          throw apiError;
        } finally {
          activePromises.delete(promiseKey);
        }
      })();

      activePromises.set(promiseKey, apiPromise);

      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError(null);
        }
        
        const result = await apiPromise;
        
        if (isMountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
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
  }, [accountId, period, customDates, endpoint, memoizedApiCall, getFromCacheMeta, setCacheMeta]);

  return { data, loading, error };
};