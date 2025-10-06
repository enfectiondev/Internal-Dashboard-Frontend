import React, { useState, useEffect, useCallback } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";
import { useMetaApi } from "../hooks/useMetaApi";
import MetaMetricCard from "../components/MetaMetricCard";
import MetaCampaignsTable from "../components/MetaCampaignsTable";
import MetaLoadingSkeleton from "../components/MetaLoadingSkeleton";
import MetaTimeSeriesChart from "../components/MetaTimeSeriesChart";
import MetaDemographicsChart from "../components/MetaDemographicsChart";
import MetaPlacementsChart from "../components/MetaPlacementsChart";

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

  // Check if Facebook token exists as fallback
  const storedToken = typeof window !== 'undefined' ? window.localStorage?.getItem('facebook_token') : null;
  const hasFacebookToken = isAuthenticated || !!storedToken;
  const activeToken = facebookToken || storedToken;

  // Get display user - prefer original user, fallback to Facebook user
  const getDisplayUser = () => {
    if (typeof window !== 'undefined') {
      const storedUser = window.localStorage?.getItem("user");
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (err) {
          console.error("Error parsing stored user:", err);
        }
      }
    }
    return facebookUser || { 
      name: "Meta User", 
      email: "meta_user",
      picture: null 
    };
  };

  const displayUser = getDisplayUser();

  // API call function for campaigns
  const campaignApiCall = useCallback(async (accountId, period, customDates) => {
    const token = facebookToken;
    
    if (!token) {
      throw new Error('No Facebook token available');
    }

    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts/${accountId}/campaigns`;
    
    // Add date parameters if custom period is being used
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `?start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        handleDisconnect();
        throw new Error('Authentication failed. Please reconnect your Facebook account.');
      }
      throw new Error(`Failed to fetch campaign data: ${response.status}`);
    }
    
    return await response.json();
  }, [facebookToken, handleDisconnect]);

  // Use the caching hook
  const { data: campaignData, loading: isLoadingCampaigns, error } = useMetaApi(
    selectedAccount?.id,
    period,
    customDates,
    'campaigns',
    campaignApiCall
  );

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
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} />;
  }

  // Display selected account details if available
  if (selectedAccount) {
    return (
      <div className="space-y-6">
        {/* User Info Header with Selected Account */}
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-red-800 font-medium">Error loading campaign data</div>
                <div className="text-red-600 text-sm mt-1">{error.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* Campaign Metrics Cards */}
        {isLoadingCampaigns ? (
          <MetaLoadingSkeleton />
        ) : campaignData?.totals ? (
          <>
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetaMetricCard
                title="Total Spend"
                value={campaignData.totals.total_spend}
                currency={selectedAccount.currency}
                subtitle="Campaign budget utilized"
              />
              <MetaMetricCard
                title="Total Impressions"
                value={campaignData.totals.total_impressions?.toLocaleString()}
                subtitle="Total ad views"
              />
              <MetaMetricCard
                title="Total Clicks"
                value={campaignData.totals.total_clicks?.toLocaleString()}
                subtitle="User engagement"
              />
              <MetaMetricCard
                title="Total Reach"
                value={campaignData.totals.total_reach?.toLocaleString()}
                subtitle="Unique users reached"
              />
            </div>

            {/* Campaigns Table */}
            <MetaCampaignsTable 
              campaigns={campaignData.campaigns || []}
              currency={selectedAccount.currency}
              onLoadStats={handleLoadStats}
            />

            {/* Stats Visualization Section */}
            {showStats && selectedCampaignsForStats.length > 0 && (
              <div className="space-y-6">
                {/* Time Series and Demographics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <MetaTimeSeriesChart
                    selectedCampaigns={selectedCampaignsForStats}
                    period={period}
                    customDates={customDates}
                    facebookToken={facebookToken}
                  />
                  <MetaDemographicsChart
                    selectedCampaigns={selectedCampaignsForStats}
                    period={period}
                    customDates={customDates}
                    facebookToken={facebookToken}
                    currency={selectedAccount.currency}
                  />
                </div>

                {/* Placements Chart */}
                <MetaPlacementsChart
                  selectedCampaigns={selectedCampaignsForStats}
                  period={period}
                  customDates={customDates}
                  facebookToken={facebookToken}
                  currency={selectedAccount.currency}
                />
              </div>
            )}

            {/* Success Info */}
            {!showStats && (
              <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="font-semibold">Meta Ads Account Active!</h4>
                    <p className="text-sm mt-1">
                      Viewing {campaignData.campaigns?.length || 0} campaign{campaignData.campaigns?.length !== 1 ? 's' : ''} for {selectedAccount.name}
                      {period === 'CUSTOM' && customDates?.startDate && customDates?.endDate && (
                        <> ({customDates.startDate} to {customDates.endDate})</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Campaign Data Available
            </h3>
            <p className="text-gray-600">
              No campaign data found for the selected period. Try adjusting the date range or check if there are active campaigns in this account.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Default view when no account is selected but authenticated
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