import React, { useState, useEffect } from "react";
import MetaAdSetsTable from "../components/MetaAdSetsTable";
import MetaAdSetsTimeSeriesChart from "../components/MetaAdSetsTimeSeriesChart";
import MetaAdSetsDemographicsChart from "../components/MetaAdSetsDemographicsChart";
import MetaAdSetsPlacementsChart from "../components/MetaAdSetsPlacementsChart";
import MetaAdsSection from "../components/MetaAdsSection";

function MetaAdSetsSection({ selectedCampaigns, period, customDates, facebookToken, currency }) {
  const [adSetsData, setAdSetsData] = useState([]);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedAdSetsForStats, setSelectedAdSetsForStats] = useState([]);

  // Fetch ad sets only when campaigns change (NOT when period changes)
  useEffect(() => {
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      fetchAdSets();
    } else {
      setAdSetsData([]);
      setShowStats(false);
      setSelectedAdSetsForStats([]);
    }
  }, [selectedCampaigns]); // Removed period and customDates from dependencies

  const fetchAdSets = async () => {
    setIsLoadingAdSets(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }

      const campaignIds = selectedCampaigns.map(c => c.campaign_id);
      
      // Fetch all ad sets without date filtering
      const url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/adsets`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignIds)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ad sets: ${response.status}`);
      }

      const data = await response.json();
      setAdSetsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ad sets:', err);
    } finally {
      setIsLoadingAdSets(false);
    }
  };

  const handleLoadStats = (adsets) => {
    setSelectedAdSetsForStats(adsets);
    setShowStats(true);
  };

  if (!selectedCampaigns || selectedCampaigns.length === 0) {
    return (
      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Select Campaigns First</h4>
            <p className="text-sm mt-1">
              Please select campaigns from the table above and click "Load Stats" to view ad sets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingAdSets) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading ad sets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-red-800 font-medium">Error loading ad sets</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ad Sets Table */}
      <MetaAdSetsTable
        adsets={adSetsData}
        currency={currency}
        onLoadStats={handleLoadStats}
        selectedAdSetsForStats={selectedAdSetsForStats}
      />

      {/* Stats Visualization Section */}
      {showStats && selectedAdSetsForStats.length > 0 && (
        <div className="space-y-6">
          {/* Time Series and Placements Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetaAdSetsTimeSeriesChart
              selectedAdSets={selectedAdSetsForStats}
              period={period}
              customDates={customDates}
              facebookToken={facebookToken}
            />
            <MetaAdSetsPlacementsChart
              selectedAdSets={selectedAdSetsForStats}
              period={period}
              customDates={customDates}
              facebookToken={facebookToken}
              currency={currency}
            />
          </div>

          {/* Demographics Chart - Full Width */}
          <MetaAdSetsDemographicsChart
            selectedAdSets={selectedAdSetsForStats}
            period={period}
            customDates={customDates}
            facebookToken={facebookToken}
            currency={currency}
          />
        </div>
      )}

      {/* Info message when ad sets loaded but no stats shown */}
      {!showStats && adSetsData.length > 0 && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold">Ad Sets Loaded!</h4>
              <p className="text-sm mt-1">
                Found {adSetsData.length} ad set{adSetsData.length !== 1 ? 's' : ''} for the selected campaign{selectedCampaigns.length !== 1 ? 's' : ''}. Select ad sets and click "Load Stats" to view detailed analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No ad sets message */}
      {!showStats && adSetsData.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Ad Sets Found
          </h3>
          <p className="text-gray-600">
            No ad sets were found for the selected campaigns.
          </p>
        </div>
      )}

      {/* Add this at the very end, after Demographics Chart */}
      {showStats && selectedAdSetsForStats.length > 0 && (
        <>
          <div className="border-t-4 border-[#508995] my-8"></div>
          
          <div className="bg-[#1A6473]/30 border border-[#508995] rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-white mb-1">Ads for Selected Ad Sets</h3>
            <p className="text-[#A1BCD3] text-sm">
              View and analyze ads from the {selectedAdSetsForStats.length} selected ad set{selectedAdSetsForStats.length !== 1 ? 's' : ''}
            </p>
          </div>

          <MetaAdsSection
            selectedAdSets={selectedAdSetsForStats}
            period={period}
            customDates={customDates}
            facebookToken={facebookToken}
            currency={currency}
          />
        </>
      )}
    </div>
  );
}

export default MetaAdSetsSection;