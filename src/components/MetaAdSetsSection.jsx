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

  // Fetch ad sets when campaigns change
  useEffect(() => {
    console.log("MetaAdSetsSection useEffect triggered");
    console.log("selectedCampaigns:", selectedCampaigns);
    
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      console.log(`Fetching ad sets for ${selectedCampaigns.length} campaigns`);
      fetchAdSets();
    } else {
      console.log("No campaigns selected, clearing ad sets");
      setAdSetsData([]);
      setShowStats(false);
      setSelectedAdSetsForStats([]);
    }
  }, [selectedCampaigns]); // Only trigger when campaigns change

  const fetchAdSets = async () => {
    setIsLoadingAdSets(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }

      const campaignIds = selectedCampaigns.map(c => c.campaign_id);
      console.log("Campaign IDs to fetch ad sets for:", campaignIds);
      
      const url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/adsets`;

      console.log("Making request to:", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignIds)
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch ad sets: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ad sets received:", data.length);
      
      setAdSetsData(data);
      
      if (data.length === 0) {
        console.warn("No ad sets found for selected campaigns");
      }
      
    } catch (err) {
      console.error('Error in fetchAdSets:', err);
      setError(err.message);
    } finally {
      setIsLoadingAdSets(false);
    }
  };

  const handleLoadStats = (adsets) => {
    console.log("Loading stats for", adsets.length, "ad sets");
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
      <div className="bg-white rounded-lg shadow-sm p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">Loading Ad Sets...</p>
            <p className="text-sm text-gray-500 mt-1">
              Fetching ad sets for {selectedCampaigns.length} campaign{selectedCampaigns.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-red-800 font-semibold text-lg">Error Loading Ad Sets</div>
            <div className="text-red-600 text-sm mt-2">{error}</div>
            <button 
              onClick={fetchAdSets}
              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (adSetsData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Ad Sets Found
        </h3>
        <p className="text-gray-600 mb-4">
          No ad sets were found for the selected campaigns.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700 font-medium mb-2">Selected Campaigns:</p>
          <p className="text-sm text-gray-600">
            {selectedCampaigns.map(c => c.campaign_name).join(', ')}
          </p>
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
          {/* Header for stats section */}
          <div className="bg-[#1A6473]/30 border border-[#508995] rounded-lg p-4">
            <h3 className="text-lg font-bold text-white mb-1">
              Ad Set Performance Analytics
            </h3>
            <p className="text-[#A1BCD3] text-sm">
              Viewing detailed analytics for {selectedAdSetsForStats.length} selected ad set{selectedAdSetsForStats.length !== 1 ? 's' : ''}
            </p>
          </div>

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
              <h4 className="font-semibold">Ad Sets Loaded Successfully!</h4>
              <p className="text-sm mt-1">
                Found {adSetsData.length} ad set{adSetsData.length !== 1 ? 's' : ''} for the selected campaign{selectedCampaigns.length !== 1 ? 's' : ''}. 
                Select ad sets from the table and click "Load Stats" to view detailed performance analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ads Section */}
      {showStats && selectedAdSetsForStats.length > 0 && (
        <>
          <div className="border-t-4 border-[#508995] my-8"></div>
          
          <div className="bg-[#1A6473]/30 border border-[#508995] rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-white mb-1">Ads for Selected Ad Sets</h3>
            <p className="text-[#A1BCD3] text-sm">
              View and analyze individual ads from the {selectedAdSetsForStats.length} selected ad set{selectedAdSetsForStats.length !== 1 ? 's' : ''}
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