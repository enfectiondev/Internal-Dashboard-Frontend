import React, { useState, useEffect } from "react";
import MetaMetricCard from "../components/MetaMetricCard";
import MetaCampaignsTable from "../components/MetaCampaignsTable";
import MetaAdSetsSection from "../components/MetaAdSetsSection";

function MetaAds({ selectedAccount, period, customDates, facebookToken, currency }) {
  const [accountMetrics, setAccountMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCampaignsForStats, setSelectedCampaignsForStats] = useState([]);
  const [showStats, setShowStats] = useState(false);
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const LIMIT = 5; // Load 5 campaigns at a time

  // Fetch account metrics when account or period changes
  useEffect(() => {
    if (selectedAccount) {
      fetchAccountMetrics();
      fetchInitialCampaigns();
    }
  }, [selectedAccount, period, customDates]);

  const fetchAccountMetrics = async () => {
    setIsLoadingMetrics(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }

      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts/${selectedAccount.id}/metrics`;
      
      const params = new URLSearchParams();
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        params.append('start_date', customDates.startDate);
        params.append('end_date', customDates.endDate);
      } else {
        const periodMap = {
          'LAST_7_DAYS': '7d',
          'LAST_30_DAYS': '30d',
          'LAST_90_DAYS': '90d',
          'LAST_365_DAYS': '365d'
        };
        params.append('period', periodMap[period] || '30d');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      setAccountMetrics(data.metrics);
      
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchInitialCampaigns = async () => {
    setIsLoadingCampaigns(true);
    setError(null);
    setCampaigns([]);
    setOffset(0);

    try {
      const result = await fetchCampaignsBatch(0, LIMIT);
      setCampaigns(result.campaigns);
      setHasMore(result.has_more);
      setTotalAvailable(result.total_available);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const fetchCampaignsBatch = async (currentOffset, limit) => {
    const token = facebookToken || localStorage.getItem('facebook_token');
    
    if (!token) {
      throw new Error('No Facebook token available');
    }

    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts/${selectedAccount.id}/campaigns/paginated`;
    
    const params = new URLSearchParams();
    params.append('offset', currentOffset.toString());
    params.append('limit', limit.toString());
    
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      params.append('start_date', customDates.startDate);
      params.append('end_date', customDates.endDate);
    } else {
      const periodMap = {
        'LAST_7_DAYS': '7d',
        'LAST_30_DAYS': '30d',
        'LAST_90_DAYS': '90d',
        'LAST_365_DAYS': '365d'
      };
      params.append('period', periodMap[period] || '30d');
    }
    
    url += `?${params.toString()}`;

    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch campaigns: ${response.status}`);
    }

    return await response.json();
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    
    try {
      const newOffset = offset + LIMIT;
      const result = await fetchCampaignsBatch(newOffset, LIMIT);
      
      setCampaigns(prev => [...prev, ...result.campaigns]);
      setOffset(newOffset);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadStats = (campaigns) => {
    setSelectedCampaignsForStats(campaigns);
    setShowStats(true);
  };

  if (!selectedAccount) {
    return (
      <div className="text-white text-center py-12">
        <p>Select an ad account to view campaigns and metrics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account-Level Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetaMetricCard
          title="Total Spend"
          value={accountMetrics?.spend}
          currency={selectedAccount.currency}
          showNoData={isLoadingMetrics || !accountMetrics}
        />
        <MetaMetricCard
          title="Total Impressions"
          value={accountMetrics?.impressions}
          showNoData={isLoadingMetrics || !accountMetrics}
        />
        <MetaMetricCard
          title="Total Clicks"
          value={accountMetrics?.clicks}
          showNoData={isLoadingMetrics || !accountMetrics}
        />
        <MetaMetricCard
          title="Total Reach"
          value={accountMetrics?.reach}
          showNoData={isLoadingMetrics || !accountMetrics}
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">
            Metrics above show totals for your entire ad account. 
            Campaign table below loads {LIMIT} campaigns at a time to avoid rate limits.
            {totalAvailable > 0 && ` (${campaigns.length} of ${totalAvailable} loaded)`}
          </p>
        </div>
      </div>

      {/* Campaigns Table */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {isLoadingCampaigns ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-700">Loading campaigns...</span>
          </div>
        </div>
      ) : (
        <>
          <MetaCampaignsTable
            campaigns={campaigns}
            currency={selectedAccount.currency}
            onLoadStats={handleLoadStats}
            selectedCampaignsForStats={selectedCampaignsForStats}
            showLoadMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            totalAvailable={totalAvailable}
            currentlyShown={campaigns.length}
          />
        </>
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
            facebookToken={facebookToken}
            currency={selectedAccount.currency}
          />
        </>
      )}
    </div>
  );
}

export default MetaAds;