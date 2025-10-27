import React, { useState, useEffect } from "react";
import MetaAdsTable from "../components/MetaAdsTable";
import MetaAdsTimeSeriesChart from "../components/MetaAdsTimeSeriesChart";
import MetaAdsDemographicsChart from "../components/MetaAdsDemographicsChart";
import MetaAdsPlacementsChart from "../components/MetaAdsPlacementsChart";
import MetaAdsMetrics from "../components/MetaAdsMetrics";

function MetaAdsSection({ selectedAdSets, period, customDates, facebookToken, currency }) {
  const [adsData, setAdsData] = useState([]);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [error, setError] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedAdsForStats, setSelectedAdsForStats] = useState([]);
  const [timeSeriesTotals, setTimeSeriesTotals] = useState(null);

  // Fetch ads only when ad sets change (NOT when period changes)
  useEffect(() => {
    if (selectedAdSets && selectedAdSets.length > 0) {
      fetchAds();
    } else {
      setAdsData([]);
      setShowStats(false);
      setSelectedAdsForStats([]);
    }
  }, [selectedAdSets]); // Removed period and customDates from dependencies

  const fetchAds = async () => {
    setIsLoadingAds(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }

      const adsetIds = selectedAdSets.map(a => a.id);
      
      // Fetch all ads without date filtering
      const url = `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/meta/adsets/ads`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adsetIds)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ads: ${response.status}`);
      }

      const data = await response.json();
      setAdsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ads:', err);
    } finally {
      setIsLoadingAds(false);
    }
  };

  const handleLoadStats = (ads) => {
    setSelectedAdsForStats(ads);
    setShowStats(true);
  };

  if (!selectedAdSets || selectedAdSets.length === 0) {
    return (
      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Select Ad Sets First</h4>
            <p className="text-sm mt-1">
              Please select ad sets from the table above and click "Load Stats" to view ads.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingAds) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading ads...</span>
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
            <div className="text-red-800 font-medium">Error loading ads</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ads Table */}
      <MetaAdsTable
        ads={adsData}
        currency={currency}
        onLoadStats={handleLoadStats}
        selectedAdsForStats={selectedAdsForStats}
      />

      {/* Stats Visualization Section */}
      {showStats && selectedAdsForStats.length > 0 && (
        <div className="space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Time Series */}
            <MetaAdsTimeSeriesChart
              selectedAds={selectedAdsForStats}
              period={period}
              customDates={customDates}
              facebookToken={facebookToken}
              onTotalsCalculated={setTimeSeriesTotals}
            />
            
            {/* Right Column - Metrics Cards + Placements */}
            <div className="space-y-6">
              {/* Metrics Cards */}
              <MetaAdsMetrics 
                totals={timeSeriesTotals}
                currency={currency}
                isLoading={!timeSeriesTotals}
              />
              
              {/* Placements Chart */}
              <MetaAdsPlacementsChart
                selectedAds={selectedAdsForStats}
                period={period}
                customDates={customDates}
                facebookToken={facebookToken}
                currency={currency}
              />
            </div>
          </div>

          {/* Demographics Chart - Full Width */}
          <MetaAdsDemographicsChart
            selectedAds={selectedAdsForStats}
            period={period}
            customDates={customDates}
            facebookToken={facebookToken}
            currency={currency}
          />
        </div>
      )}

      {/* Info message when ads loaded but no stats shown */}
      {!showStats && adsData.length > 0 && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-6 py-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold">Ads Loaded!</h4>
              <p className="text-sm mt-1">
                Found {adsData.length} ad{adsData.length !== 1 ? 's' : ''} for the selected ad set{selectedAdSets.length !== 1 ? 's' : ''}. Select ads and click "Load Stats" to view detailed analytics.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No ads message */}
      {!showStats && adsData.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Ads Found
          </h3>
          <p className="text-gray-600">
            No ads were found for the selected ad sets.
          </p>
        </div>
      )}
    </div>
  );
}

export default MetaAdsSection;