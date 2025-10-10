import React, { useState, useEffect } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";
import { useFacebookPages, useFacebookInsights, useFacebookPosts } from "../hooks/useFacebookCache";
import FacebookMetricCards from "../components/FacebookMetricCards";
import FacebookMetricsChart from "../components/FacebookMetricsChart";
import FacebookPostsTable from "../components/FacebookPostsTable";
import FacebookEngagementChart from "../components/FacebookEngagementChart";
import FacebookPostTypesChart from "../components/FacebookPostTypesChart";

const FacebookAnalytics = ({ period, customDates }) => {
  const { 
    facebookUser, 
    facebookToken, 
    isLoading, 
    handleFacebookLogin, 
    handleDisconnect, 
    isAuthenticated 
  } = useFacebookAuth();
  
  const [selectedPage, setSelectedPage] = useState(null);
  const [timeseriesData, setTimeseriesData] = useState(null);
  const [loadingTimeseries, setLoadingTimeseries] = useState(false);

  const activeToken = facebookToken || localStorage.getItem('facebook_token');

  // Fetch pages with caching
  const { 
    pages, 
    loading: loadingPages, 
    error: pagesError 
  } = useFacebookPages(activeToken);

  // Auto-select first page when pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPage) {
      setSelectedPage(pages[0]);
    }
  }, [pages, selectedPage]);

  // Fetch page insights with caching (keeping for backward compatibility)
  const {
    data: pageInsights,
    loading: loadingInsights,
    error: insightsError
  } = useFacebookInsights(
    selectedPage?.id,
    period,
    customDates,
    activeToken
  );

  // Fetch page posts with caching
  const {
    data: pagePosts,
    loading: loadingPosts,
    error: postsError
  } = useFacebookPosts(
    selectedPage?.id,
    period,
    customDates,
    activeToken,
    20 // limit
  );

  // Normalize period format - convert "7 Days" to "7d", "30 Days" to "30d", etc.
  const normalizePeriod = (periodValue) => {
    if (!periodValue) return '30d'; // default
    
    // If already in correct format (7d, 30d, etc.), return as is
    if (/^\d+d$/.test(periodValue)) {
      return periodValue;
    }
    
    // Convert various formats to API format
    const periodMap = {
      '7 Days': '7d',
      '30 Days': '30d',
      '90 Days': '90d',
      '3 Months': '90d',
      '1 Year': '365d',
      'LAST_7_DAYS': '7d',
      'LAST_30_DAYS': '30d',
      'LAST_3_MONTHS': '90d',
      'LAST_1_YEAR': '365d',
      '7': '7d',
      '30': '30d',
      '90': '90d',
      '365': '365d',
      'week': '7d',
      'month': '30d',
      'quarter': '90d',
      'year': '365d'
    };
    
    return periodMap[periodValue] || periodMap[periodValue.toLowerCase()] || '30d';
  };

  // Fetch timeseries data for the new chart
  useEffect(() => {
    if (selectedPage?.id && activeToken) {
      fetchTimeseriesData();
    }
  }, [selectedPage?.id, period, customDates, activeToken]);

  const fetchTimeseriesData = async () => {
    setLoadingTimeseries(true);
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'https://eyqi6vd53z.us-east-2.awsapprunner.com';
      
      let url = `${baseUrl}/api/meta/pages/${selectedPage.id}/insights/timeseries`;
      
      // Normalize period format - convert "7 Days" to "7d", "30 Days" to "30d", etc.
      const normalizePeriod = (periodValue) => {
        if (!periodValue) return '30d'; // default
        
        // If already in correct format (7d, 30d, etc.), return as is
        if (/^\d+d$/.test(periodValue)) {
          return periodValue;
        }
        
        // Convert various formats to API format
        const periodMap = {
          '7 Days': '7d',
          '30 Days': '30d',
          '90 Days': '90d',
          '1 Year': '365d',
          '7': '7d',
          '30': '30d',
          '90': '90d',
          '365': '365d',
          'week': '7d',
          'month': '30d',
          'quarter': '90d',
          'year': '365d'
        };
        
        return periodMap[periodValue] || periodMap[periodValue.toLowerCase()] || '30d';
      };
      
      // Add period or custom dates
      if (customDates?.startDate && customDates?.endDate) {
        url += `?start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
      } else if (period) {
        const normalizedPeriod = normalizePeriod(period);
        url += `?period=${normalizedPeriod}`;
      } else {
        // Default to 30 days if no period specified
        url += `?period=30d`;
      }

      console.log('Fetching timeseries from:', url); // Debug log

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch timeseries data: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Timeseries data received:', data); // Debug log
      setTimeseriesData(data);
    } catch (error) {
      console.error("Error fetching timeseries data:", error);
      setTimeseriesData(null);
    } finally {
      setLoadingTimeseries(false);
    }
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
  };

  const error = pagesError || insightsError || postsError;

  if (isLoading || loadingPages) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Facebook integration...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} sourceTab="facebook" />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-red-800 font-semibold text-lg">Error Loading Facebook Data</div>
              <div className="text-red-600 text-sm mt-2">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {facebookUser?.picture && (
              <img 
                src={facebookUser.picture} 
                alt={facebookUser.name}
                className="w-12 h-12 rounded-full border-2 border-[#508995] object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                Connected to Facebook
              </h2>
              <p className="text-[#A1BCD3]">
                {facebookUser?.name} {facebookUser?.email && `• ${facebookUser.email}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Page Selector */}
      {pages.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Facebook Page
          </label>
          <select
            value={selectedPage?.id || ''}
            onChange={(e) => {
              const page = pages.find(p => p.id === e.target.value);
              handlePageSelect(page);
            }}
            className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f4653] focus:outline-none"
          >
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name} ({page.followers_count?.toLocaleString() || 0} followers)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* No Pages Message */}
      {pages.length === 0 && !loadingPages && (
        <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 px-6 py-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold">No Facebook Pages Found</h4>
              <p className="text-sm mt-1">
                No Facebook Pages are associated with your account. Please create a page or ensure you have admin access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Analytics */}
      {selectedPage && (
        <>
          {/* Metric Cards - Now using timeseries summary data */}
          <FacebookMetricCards
            timeseriesData={timeseriesData}
            isLoading={loadingTimeseries}
          />

          {/* New Metrics Line Chart */}
          <FacebookMetricsChart
            timeseriesData={timeseriesData}
            isLoading={loadingTimeseries}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FacebookEngagementChart
              posts={pagePosts || []}
              isLoading={loadingPosts}
            />
            <FacebookPostTypesChart
              posts={pagePosts || []}
              isLoading={loadingPosts}
            />
          </div>

          {/* Posts Table */}
          <FacebookPostsTable
            posts={pagePosts || []}
            isLoading={loadingPosts}
          />

          {/* Success Info */}
          {!loadingTimeseries && !loadingPosts && timeseriesData && pagePosts && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold">Facebook Page Analytics Loaded!</h4>
                  <p className="text-sm mt-1">
                    Viewing analytics for {selectedPage.name} • {pagePosts.length} posts • {timeseriesData.timeseries?.length || 0} days of data
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacebookAnalytics;