import React, { useState, useEffect, useCallback } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";
import FacebookPageSelector from "../components/FacebookPageSelector";
import FacebookMetricCards from "../components/FacebookMetricCards";
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
  
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageInsights, setPageInsights] = useState(null);
  const [pagePosts, setPagePosts] = useState([]);
  
  const [loadingPages, setLoadingPages] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  
  const [error, setError] = useState(null);

  const activeToken = facebookToken || localStorage.getItem('facebook_token');

  // Fetch pages on mount
  useEffect(() => {
    if (activeToken) {
      fetchPages();
    }
  }, [activeToken]);

  // Fetch insights and posts when page or period changes
  useEffect(() => {
    if (selectedPage && activeToken) {
      setPageInsights(null);
      setPagePosts([]);
      fetchPageInsights();
      fetchPagePosts();
    }
  }, [selectedPage, period, customDates, activeToken]);

  const fetchPages = async () => {
    setLoadingPages(true);
    setError(null);
    
    try {
      const response = await fetch(
        "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/pages",
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          handleDisconnect();
          throw new Error('Authentication failed. Please reconnect.');
        }
        throw new Error(`Failed to fetch pages: ${response.status}`);
      }
      
      const data = await response.json();
      setPages(data);
      
      // Auto-select first page
      if (data.length > 0) {
        setSelectedPage(data[0]);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError(err.message);
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchPageInsights = async () => {
    if (!selectedPage) return;
    
    setLoadingInsights(true);
    
    try {
      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/pages/${selectedPage.id}/insights`;
      
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
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch insights: ${response.status}`);
      
      const data = await response.json();
      setPageInsights(data);
    } catch (err) {
      console.error('Error fetching page insights:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const fetchPagePosts = async () => {
    if (!selectedPage) return;
    
    setLoadingPosts(true);
    
    try {
      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/pages/${selectedPage.id}/posts?limit=20`;
      
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
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      if (!response.ok) throw new Error(`Failed to fetch posts: ${response.status}`);
      
      const data = await response.json();
      setPagePosts(data);
    } catch (err) {
      console.error('Error fetching page posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
  };

  if (isLoading || loadingPages) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Facebook integration...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} />;
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
              <button 
                onClick={fetchPages}
                className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Try Again
              </button>
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
                {facebookUser?.name} • {facebookUser?.email}
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
      {pages.length > 0 && (
        <FacebookPageSelector
          pages={pages}
          selectedPage={selectedPage}
          onPageSelect={handlePageSelect}
        />
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
          {/* Metric Cards */}
          <FacebookMetricCards
            insights={pageInsights}
            isLoading={loadingInsights}
            page={selectedPage}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FacebookEngagementChart
              posts={pagePosts}
              isLoading={loadingPosts}
            />
            <FacebookPostTypesChart
              posts={pagePosts}
              isLoading={loadingPosts}
            />
          </div>

          {/* Posts Table */}
          <FacebookPostsTable
            posts={pagePosts}
            isLoading={loadingPosts}
          />

          {/* Success Info */}
          {!loadingInsights && !loadingPosts && pageInsights && (
            <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold">Facebook Page Analytics Loaded!</h4>
                  <p className="text-sm mt-1">
                    Viewing analytics for {selectedPage.name} • {pagePosts.length} posts in selected period
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