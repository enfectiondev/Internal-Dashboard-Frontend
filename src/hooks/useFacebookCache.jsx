import { useState, useEffect, useCallback } from 'react';
import { useCache } from '../context/CacheContext';

/**
 * Custom hook for Facebook data with caching
 * @param {string} pageId - Facebook page ID
 * @param {string} period - Time period (LAST_7_DAYS, LAST_30_DAYS, etc.)
 * @param {object} customDates - Custom date range {startDate, endDate}
 * @param {string} endpoint - Endpoint identifier (pages, insights, posts)
 * @param {function} apiFn - API function to call if cache miss
 */
export const useFacebookCache = (pageId, period, customDates, endpoint, apiFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cache = useCache();

  // Generate cache key based on period and custom dates
  const getCacheKey = useCallback(() => {
    if (!pageId || !endpoint) return null;
    
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      return `facebook_${pageId}_${customDates.startDate}_${customDates.endDate}_${endpoint}`;
    }
    
    return `facebook_${pageId}_${period || 'LAST_30_DAYS'}_${endpoint}`;
  }, [pageId, period, customDates, endpoint]);

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!pageId || !apiFn) {
      console.log('[Facebook Cache] Missing pageId or apiFn');
      return;
    }

    const cacheKey = getCacheKey();
    if (!cacheKey) {
      console.log('[Facebook Cache] Invalid cache key');
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = cache.getRawCacheData(cacheKey);
      if (cachedData) {
        console.log(`[Facebook Cache HIT] ${cacheKey}`);
        setData(cachedData);
        setError(null);
        return;
      }
    }

    console.log(`[Facebook Cache MISS] ${cacheKey} - Fetching from API`);
    setLoading(true);
    setError(null);

    try {
      const result = await apiFn();
      
      // Only cache successful results with data
      if (result) {
        console.log(`[Facebook Cache SET] ${cacheKey}`, result);
        cache.setCache(pageId, period, endpoint, result, 'facebook');
        setData(result);
      }
    } catch (err) {
      console.error(`[Facebook Cache ERROR] ${cacheKey}:`, err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [pageId, period, customDates, endpoint, apiFn, getCacheKey, cache]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (pageId && apiFn) {
      fetchData();
    }
  }, [pageId, period, customDates, endpoint]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true), // Force refresh
    isFromCache: !loading && data !== null
  };
};

/**
 * Hook specifically for Facebook pages list
 */
export const useFacebookPages = (token) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cache = useCache();
  const cacheKey = 'facebook_pages_list';

  const fetchPages = useCallback(async (forceRefresh = false) => {
    if (!token) return;

    // Check cache first
    if (!forceRefresh) {
      const cachedPages = cache.getRawCacheData(cacheKey);
      if (cachedPages) {
        console.log('[Facebook Pages Cache HIT]');
        setPages(cachedPages);
        return;
      }
    }

    console.log('[Facebook Pages Cache MISS] - Fetching from API');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/meta/pages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('[Facebook Pages Cache SET]', data);
      // Cache with special key for pages list
      cache.setCache('facebook', 'pages', 'list', data, 'facebook');
      setPages(data);
    } catch (err) {
      console.error('[Facebook Pages ERROR]:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, cache]);

  useEffect(() => {
    if (token) {
      fetchPages();
    }
  }, [token]);

  return {
    pages,
    loading,
    error,
    refetch: () => fetchPages(true)
  };
};

/**
 * Hook for Facebook page insights
 */
export const useFacebookInsights = (pageId, period, customDates, token) => {
  const apiFn = useCallback(async () => {
    if (!pageId || !token) return null;

    let url = `${process.env.REACT_APP_API_BASE_URL}/api/meta/pages/${pageId}/insights`;
    
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `?start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    } else if (period) {
      const periodMap = {
        'LAST_7_DAYS': '7d',
        'LAST_30_DAYS': '30d',
        'LAST_90_DAYS': '90d',
        'LAST_365_DAYS': '365d'
      };
      const apiPeriod = periodMap[period] || '30d';
      url += `?period=${apiPeriod}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch insights: ${response.status}`);
    }

    return await response.json();
  }, [pageId, period, customDates, token]);

  return useFacebookCache(pageId, period, customDates, 'insights', apiFn);
};

/**
 * Hook for Facebook page posts
 */
export const useFacebookPosts = (pageId, period, customDates, token, limit = 20) => {
  const apiFn = useCallback(async () => {
    if (!pageId || !token) return null;

    let url = `${process.env.REACT_APP_API_BASE_URL}/api/meta/pages/${pageId}/posts?limit=${limit}`;
    
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    } else if (period) {
      const periodMap = {
        'LAST_7_DAYS': '7d',
        'LAST_30_DAYS': '30d',
        'LAST_90_DAYS': '90d',
        'LAST_365_DAYS': '365d'
      };
      const apiPeriod = periodMap[period] || '30d';
      url += `&period=${apiPeriod}`;
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    return await response.json();
  }, [pageId, period, customDates, token, limit]);

  return useFacebookCache(pageId, period, customDates, 'posts', apiFn);
};