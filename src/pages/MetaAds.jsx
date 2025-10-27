import React, { useState, useEffect, useCallback } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";
import MetaMetricCard from "../components/MetaMetricCard";
import MetaCampaignsTable from "../components/MetaCampaignsTable";
import MetaLoadingSkeleton from "../components/MetaLoadingSkeleton";
import MetaTimeSeriesChart from "../components/MetaTimeSeriesChart";
import MetaDemographicsChart from "../components/MetaDemographicsChart";
import MetaPlacementsChart from "../components/MetaPlacementsChart";
import MetaAdSetsSection from "../components/MetaAdSetsSection";
import MetaTimeSeriesMetrics from "../components/MetaTimeSeriesMetrics";
import AIChatComponent from "../components/AIChatComponent";

const MetaAds = ({ period, selectedAccount, customDates }) => {
  const { 
    facebookUser, 
    facebookToken, 
    isLoading, 
    handleFacebookLogin, 
    handleDisconnect, 
    isAuthenticated 
  } = useFacebookAuth();

  const [showStats, setShowStats] = useState(false);
  const [selectedCampaignsForStats, setSelectedCampaignsForStats] = useState([]);
  const [timeSeriesTopals, setTimeSeriesTopals] = useState(null);
  
  // Account summary stats (from account-level endpoint)
  const [accountSummary, setAccountSummary] = useState(null);
  const [loadingAccountSummary, setLoadingAccountSummary] = useState(false);
  const [accountSummaryError, setAccountSummaryError] = useState(null);
  
  // Paginated campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignsError, setCampaignsError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 5,
    has_more: false,
    current_page: 1,
    total_pages: 0
  });

  const hasFacebookToken = isAuthenticated || localStorage.getItem('facebook_token');

  const getDisplayUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
    return facebookUser || { 
      name: "Meta User", 
      email: "meta_user",
      picture: null 
    };
  };

  const displayUser = getDisplayUser();
  const activeToken = facebookToken || localStorage.getItem('facebook_token');

  // Fetch account summary (for metric cards)
  const fetchAccountSummary = useCallback(async () => {
    if (!selectedAccount?.id || !activeToken) return;

    setLoadingAccountSummary(true);
    setAccountSummaryError(null);

    try {
      // Try new endpoint first, fallback to old endpoint
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/meta/ad-accounts/${selectedAccount.id}/insights/summary`;
      
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
      
      if (!response.ok) {
        // Fallback: Use old endpoint with insights
        console.warn("Summary endpoint not available, using insights endpoint as fallback");
        const fallbackUrl = `${import.meta.env.VITE_API_BASE_URL}/api/meta/ad-accounts/${selectedAccount.id}/insights${url.includes('?') ? url.substring(url.indexOf('?')) : ''}`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        
        if (!fallbackResponse.ok) throw new Error(`Failed to fetch account data: ${fallbackResponse.status}`);
        
        const fallbackData = await fallbackResponse.json();
        // Transform old format to new format
        setAccountSummary({
          total_spend: fallbackData.spend || 0,
          total_impressions: fallbackData.impressions || 0,
          total_clicks: fallbackData.clicks || 0,
          total_conversions: fallbackData.conversions || 0,
          total_reach: fallbackData.reach || 0,
          avg_cpc: fallbackData.cpc || 0,
          avg_cpm: fallbackData.cpm || 0,
          avg_ctr: fallbackData.ctr || 0,
          avg_frequency: fallbackData.frequency || 0
        });
      } else {
        const data = await response.json();
        setAccountSummary(data);
      }
    } catch (err) {
      console.error("Error fetching account summary:", err);
      setAccountSummaryError(err.message);
    } finally {
      setLoadingAccountSummary(false);
    }
  }, [selectedAccount?.id, period, customDates, activeToken]);

  // Fetch paginated campaigns
  const fetchCampaigns = useCallback(async (offset = 0, append = false) => {
    if (!selectedAccount?.id || !activeToken) return;

    setLoadingCampaigns(true);
    setCampaignsError(null);

    try {
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/meta/ad-accounts/${selectedAccount.id}/campaigns/paginated?limit=${pagination.limit}&offset=${offset}`;
      
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
      
      if (!response.ok) throw new Error(`Failed to fetch campaigns: ${response.status}`);
      
      const data = await response.json();
      
      if (append) {
        setCampaigns(prev => [...prev, ...data.campaigns]);
      } else {
        setCampaigns(data.campaigns);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaignsError(err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  }, [selectedAccount?.id, period, customDates, activeToken, pagination.limit]);

  // Initial load and period changes
  useEffect(() => {
    if (selectedAccount?.id && activeToken) {
      // Clear existing campaigns when period changes to show clean loading state
      setCampaigns([]);
      setPagination({
        total: 0,
        offset: 0,
        limit: 5,
        has_more: false,
        current_page: 1,
        total_pages: 0
      });
      
      // Hide stats when period changes
      setShowStats(false);
      setSelectedCampaignsForStats([]);
      
      fetchAccountSummary();
      fetchCampaigns(0, false); // Reset to first page
    }
  }, [selectedAccount?.id, period, customDates, activeToken]);

  const handleLoadMore = () => {
    const nextOffset = pagination.offset + pagination.limit;
    fetchCampaigns(nextOffset, true); // Append to existing campaigns
  };

  const handleLoadStats = (campaigns) => {
    setSelectedCampaignsForStats(campaigns);
    setShowStats(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Meta Ads integration...</span>
      </div>
    );
  }

  if (!hasFacebookToken) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} sourceTab="meta_ads" />;
  }

  if (selectedAccount) {
    return (
      <div className="space-y-6">
        {/* User Info Header */}
        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {(facebookUser?.picture || displayUser.picture) && (
                <img 
                  src={facebookUser?.picture || displayUser.picture} 
                  alt={displayUser.name}
                  className="w-12 h-12 rounded-full border-2 border-[#508995] object-cover"
                />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedAccount.name}
                </h2>
                <p className="text-[#A1BCD3]">
                  {selectedAccount.account_id} | {selectedAccount.currency}
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

        {/* Error Display */}
        {(accountSummaryError || campaignsError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-red-800 font-medium">Error loading data</div>
                <div className="text-red-600 text-sm mt-1">
                  {accountSummaryError || campaignsError}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Account Summary Metric Cards */}
        {loadingAccountSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-300 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : accountSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetaMetricCard
              title="Total Spend"
              value={accountSummary.total_spend}
              currency={selectedAccount.currency}
              subtitle="Total ad spend"
            />
            <MetaMetricCard
              title="Total Impressions"
              value={accountSummary.total_impressions?.toLocaleString()}
              subtitle="Total ad views"
            />
            <MetaMetricCard
              title="Total Clicks"
              value={accountSummary.total_clicks?.toLocaleString()}
              subtitle="User engagement"
            />
            <MetaMetricCard
              title="Total Reach"
              value={accountSummary.total_reach?.toLocaleString()}
              subtitle="Unique users reached"
            />
          </div>
        ) : null}

        {/* Campaigns Table with Pagination */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
              {pagination.total > 0 && !loadingCampaigns && (
                <p className="text-sm text-gray-600 mt-1">
                  Showing {campaigns.length} of {pagination.total} campaigns
                </p>
              )}
            </div>
          </div>

          {loadingCampaigns && campaigns.length === 0 ? (
            <div className="p-8">
              {/* Loading Skeleton */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 mt-4 text-center text-sm">Loading campaigns...</p>
            </div>
          ) : campaignsError ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">Error loading campaigns</div>
              <div className="text-sm text-gray-600">{campaignsError}</div>
            </div>
          ) : campaigns.length > 0 ? (
            <>
              <MetaCampaignsTable 
                campaigns={campaigns}
                currency={selectedAccount.currency}
                onLoadStats={handleLoadStats}
                selectedCampaignsForStats={selectedCampaignsForStats}
              />

              {/* Load More Button */}
              {pagination.has_more && (
                <div className="p-4 border-t border-gray-200 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingCampaigns}
                    className="px-6 py-2 bg-[#508995] text-white rounded-lg hover:bg-[#3F7380] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingCampaigns ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      `Load More (${pagination.total - campaigns.length} remaining)`
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No campaigns found for the selected period
            </div>
          )}
        </div>

        {/* Stats Visualization Section */}
        {showStats && selectedCampaignsForStats.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetaTimeSeriesChart
                selectedCampaigns={selectedCampaignsForStats}
                period={period}
                customDates={customDates}
                facebookToken={activeToken}
                onTotalsCalculated={setTimeSeriesTopals}
              />
              
              <div className="space-y-6">
                <MetaTimeSeriesMetrics 
                  totals={timeSeriesTopals}
                  currency={selectedAccount.currency}
                  isLoading={!timeSeriesTopals}
                />
                
                <MetaPlacementsChart
                  selectedCampaigns={selectedCampaignsForStats}
                  period={period}
                  customDates={customDates}
                  facebookToken={activeToken}
                  currency={selectedAccount.currency}
                />
              </div>
            </div>

            <MetaDemographicsChart
              selectedCampaigns={selectedCampaignsForStats}
              period={period}
              customDates={customDates}
              facebookToken={activeToken}
              currency={selectedAccount.currency}
            />
          </div>
        )}

        {/* Ad Sets Section */}
        {showStats && selectedCampaignsForStats.length > 0 && (
          <>
            <div className="border-t-4 border-[#508995] my-8"></div>
            
            <div className="bg-[#1A6473]/30 border border-[#508995] rounded-lg p-4 mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Ad Sets for Selected Campaigns</h3>
              <p className="text-[#A1BCD3] text-sm">
                View and analyze ad sets from the {selectedCampaignsForStats.length} selected campaign{selectedCampaignsForStats.length !== 1 ? 's' : ''}
              </p>
            </div>

            <MetaAdSetsSection
              selectedCampaigns={selectedCampaignsForStats}
              period={period}
              customDates={customDates}
              facebookToken={activeToken}
              currency={selectedAccount.currency}
            />
          </>
        )}

        {/* Success Info */}
        {!showStats && campaigns.length > 0 && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold">Meta Ads Account Active!</h4>
                <p className="text-sm mt-1">
                  Viewing {campaigns.length} of {pagination.total} campaigns for {selectedAccount.name}
                  {period === 'CUSTOM' && customDates?.startDate && customDates?.endDate && (
                    <> ({customDates.startDate} to {customDates.endDate})</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Campaign Insights Section - Full width */}
        <section className="space-y-4">
          <div className="grid grid-cols-1">
            <div className="col-span-1">
              <AIChatComponent 
                chatType="metaads"
                selectedAccount={selectedAccount}
                selectedCampaigns={selectedCampaignsForStats}
                period={period}
                customDates={customDates}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {(facebookUser?.picture || displayUser.picture) && (
              <img 
                src={facebookUser?.picture || displayUser.picture} 
                alt={displayUser.name}
                className="w-12 h-12 rounded-full border-2 border-[#508995] object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                Connected to Meta Ads
              </h2>
              <p className="text-[#A1BCD3]">
                {displayUser.name} • {displayUser.email}
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

      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Select an Ad Account</h4>
            <p className="text-sm mt-1">
              Please select a Meta Ads account from the sidebar to view campaign details and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAds;