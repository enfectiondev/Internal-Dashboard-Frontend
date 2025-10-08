import React, { useState, useEffect } from "react";
import MetaAdSetsTable from "../components/MetaAdSetsTable";

function MetaAdSetsSectionDebug({ selectedCampaigns, period, customDates, facebookToken, currency }) {
  const [adSetsData, setAdSetsData] = useState([]);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    console.log("=== MetaAdSetsSection Debug ===");
    console.log("selectedCampaigns:", selectedCampaigns);
    console.log("facebookToken:", facebookToken ? `${facebookToken.substring(0, 15)}...` : "MISSING");
    console.log("localStorage token:", localStorage.getItem('facebook_token') ? "EXISTS" : "MISSING");
    
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      fetchAdSets();
    } else {
      setAdSetsData([]);
    }
  }, [selectedCampaigns]);

  const fetchAdSets = async () => {
    console.log("\n=== STARTING AD SETS FETCH ===");
    setIsLoadingAdSets(true);
    setError(null);
    setDebugInfo(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      console.log("Using token:", token ? `${token.substring(0, 15)}...` : "NONE");
      
      if (!token) {
        throw new Error('No Facebook token available');
      }

      const campaignIds = selectedCampaigns.map(c => c.campaign_id);
      console.log("Campaign IDs:", campaignIds);
      
      // Try SIMPLE endpoint first
      const simpleUrl = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/adsets/simple`;
      
      console.log("Request URL:", simpleUrl);
      console.log("Request Body:", JSON.stringify(campaignIds));
      console.log("Request Time:", new Date().toISOString());

      const startTime = performance.now();
      
      const response = await fetch(simpleUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignIds)
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      console.log("Response Status:", response.status);
      console.log("Response Time:", `${responseTime.toFixed(2)}ms`);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("Raw Response:", responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log("Parsed Data:", data);
      
      const adsets = data.adsets || [];
      console.log("Ad Sets Count:", adsets.length);
      console.log("Ad Sets:", adsets);
      
      setAdSetsData(adsets);
      setDebugInfo({
        success: true,
        responseTime,
        count: adsets.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('❌ ERROR:', err);
      console.error('Error Stack:', err.stack);
      setError(err.message);
      setDebugInfo({
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoadingAdSets(false);
      console.log("=== AD SETS FETCH COMPLETE ===\n");
    }
  };

  const runDiagnostic = async () => {
    console.log("\n=== RUNNING DIAGNOSTIC ===");
    
    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      const campaignIds = selectedCampaigns.map(c => c.campaign_id);
      
      const diagnosticUrl = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/adsets/debug`;
      
      const response = await fetch(diagnosticUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignIds)
      });

      const result = await response.json();
      console.log("Diagnostic Result:", result);
      alert("Diagnostic complete! Check console for details.");
      
    } catch (err) {
      console.error('Diagnostic error:', err);
      alert(`Diagnostic failed: ${err.message}`);
    }
  };

  if (!selectedCampaigns || selectedCampaigns.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-300 text-blue-800 px-6 py-4 rounded-lg">
        <p>Select campaigns from the table above and click "Load Stats"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info Panel */}
      <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs">
        <div className="flex justify-between items-center mb-2">
          <strong className="text-white">Debug Console</strong>
          <button
            onClick={runDiagnostic}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            Run Diagnostic
          </button>
        </div>
        <div>Selected Campaigns: {selectedCampaigns.length}</div>
        <div>Campaign IDs: {selectedCampaigns.map(c => c.campaign_id).join(', ')}</div>
        <div>Token Available: {(facebookToken || localStorage.getItem('facebook_token')) ? 'YES' : 'NO'}</div>
        <div>Ad Sets Loaded: {adSetsData.length}</div>
        {debugInfo && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div>Last Fetch: {debugInfo.timestamp}</div>
            <div>Status: {debugInfo.success ? '✅ SUCCESS' : '❌ FAILED'}</div>
            {debugInfo.responseTime && <div>Response Time: {debugInfo.responseTime.toFixed(2)}ms</div>}
            {debugInfo.error && <div className="text-red-400">Error: {debugInfo.error}</div>}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoadingAdSets && (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading ad sets...</p>
          <p className="text-gray-500 text-sm mt-2">Check browser console for details</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-red-900 font-bold text-lg">Error Loading Ad Sets</h3>
              <p className="text-red-700 mt-2">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={fetchAdSets}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                >
                  Retry
                </button>
                <button
                  onClick={runDiagnostic}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Run Diagnostic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {!isLoadingAdSets && !error && adSetsData.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Successfully loaded {adSetsData.length} ad set{adSetsData.length !== 1 ? 's' : ''}!
            </span>
          </div>
        </div>
      )}

      {/* Ad Sets Table */}
      {adSetsData.length > 0 && (
        <MetaAdSetsTable
          adsets={adSetsData}
          currency={currency}
          onLoadStats={() => {}}
          selectedAdSetsForStats={[]}
        />
      )}

      {/* No Data State */}
      {!isLoadingAdSets && !error && adSetsData.length === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-yellow-900 font-bold text-lg mb-2">No Ad Sets Found</h3>
          <p className="text-yellow-800">
            The selected campaigns don't have any ad sets, or you don't have permission to view them.
          </p>
          <button
            onClick={runDiagnostic}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 font-medium"
          >
            Run Diagnostic
          </button>
        </div>
      )}
    </div>
  );
}

export default MetaAdSetsSectionDebug;