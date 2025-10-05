import React, { useState, useEffect } from "react";
import FacebookLogin from "../components/FacebookLogin";
import { useFacebookAuth } from "../hooks/useFacebookAuth";
import MetaMetricCard from "../components/MetaMetricCard";
import MetaCampaignsTable from "../components/MetaCampaignsTable";

const MetaAds = ({ period, selectedAccount }) => {
  const { 
    facebookUser, 
    facebookToken, 
    isLoading, 
    handleFacebookLogin, 
    handleDisconnect, 
    isAuthenticated 
  } = useFacebookAuth();
  
  const [campaignData, setCampaignData] = useState(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [customPeriod, setCustomPeriod] = useState({
    startDate: '',
    endDate: ''
  });
  const [useCustomPeriod, setUseCustomPeriod] = useState(false);

  useEffect(() => {
    if (facebookToken && selectedAccount) {
      fetchCampaignData();
    }
  }, [facebookToken, selectedAccount, period, customPeriod]);

  const fetchCampaignData = async () => {
    if (!selectedAccount) return;
    
    setIsLoadingCampaigns(true);
    try {
      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts/${selectedAccount.id}/campaigns`;
      
      // Add date parameters if custom period is being used
      if (useCustomPeriod && customPeriod.startDate && customPeriod.endDate) {
        url += `?start_date=${customPeriod.startDate}&end_date=${customPeriod.endDate}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${facebookToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaignData(data);
      } else if (response.status === 401) {
        handleDisconnect();
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-white">Loading Meta Ads integration...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <FacebookLogin onFacebookLogin={handleFacebookLogin} />;
  }

  if (selectedAccount) {
    return (
      <div className="space-y-6">
        {/* User Info Header */}
        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {facebookUser.picture && (
                <img 
                  src={facebookUser.picture} 
                  alt={facebookUser.name}
                  className="w-12 h-12 rounded-full border-2 border-[#508995]"
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

        {/* Custom Date Range Selector */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useCustomPeriod}
                onChange={(e) => setUseCustomPeriod(e.target.checked)}
                className="w-4 h-4 text-[#1A4752] rounded"
              />
              <span className="text-sm font-medium text-gray-700">Use Custom Date Range</span>
            </label>
            
            {useCustomPeriod && (
              <>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Start:</label>
                  <input
                    type="date"
                    value={customPeriod.startDate}
                    onChange={(e) => setCustomPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#1A4752] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">End:</label>
                  <input
                    type="date"
                    value={customPeriod.endDate}
                    onChange={(e) => setCustomPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#1A4752] focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Campaign Metrics Cards */}
        {isLoadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-700">Loading campaign data...</span>
          </div>
        ) : campaignData?.totals ? (
          <>
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
              campaigns={campaignData.campaigns}
              currency={selectedAccount.currency}
            />
          </>
        ) : (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            No campaign data available for the selected period
          </div>
        )}
      </div>
    );
  }

  // Default view when no account selected
  return (
    <div className="space-y-6">
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {facebookUser.picture && (
              <img 
                src={facebookUser.picture} 
                alt={facebookUser.name}
                className="w-12 h-12 rounded-full border-2 border-[#508995]"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">Connected to Meta Ads</h2>
              <p className="text-[#A1BCD3]">{facebookUser.name} • {facebookUser.email}</p>
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
              Please select a Meta Ads account from the sidebar to view details and analytics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetaAds;