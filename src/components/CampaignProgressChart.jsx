import React, { useState } from "react";
import { useApiWithCache } from "../hooks/useApiWithCache";

function CampaignProgressChart({ activeCampaign, period = "LAST_7_DAYS" }) {
  // Blue/Gray color scheme
  const colors = {
    enabled: "#1a4752ff",    // Dark blue
    paused: "#64748b",     // Slate gray
    removed: "#cbd5e1"     // Light gray
  };

  // Convert period for API
  const convertPeriodForAPI = (period) => {
    const periodMap = {
      'LAST_7_DAYS': 'LAST_7_DAYS',
      'LAST_30_DAYS': 'LAST_30_DAYS',
      'LAST_3_MONTHS': 'LAST_90_DAYS',
      'LAST_1_YEAR': 'LAST_365_DAYS'
    };
    return periodMap[period] || period;
  };

  // Map campaign type
  const mapCampaignType = (type) => {
    const typeMap = {
      'SEARCH': 'Search',
      'DISPLAY': 'Display',
      'VIDEO': 'Video/YouTube',
      'SHOPPING': 'Shopping',
      'HOTEL': 'Hotel',
      'DISCOVERY': 'Discovery',
      'PERFORMANCE_MAX': 'Performance Max',
      'LOCAL': 'Local',
      'SMART': 'Smart',
      'UNKNOWN': 'Other'
    };
    const cleanType = (type || 'UNKNOWN').toString().toUpperCase();
    return typeMap[cleanType] || 'Other';
  };

  const campaignProgressApiCall = async (customerId, period) => {
    const token = localStorage.getItem("token");
    const convertedPeriod = convertPeriodForAPI(period);

    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
      `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/campaigns/${customerId}?period=${convertedPeriod}`,
      { headers }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const json = await response.json();

    let campaigns = [];
    if (json.data && Array.isArray(json.data)) campaigns = json.data;
    else if (json.campaigns && Array.isArray(json.campaigns)) campaigns = json.campaigns;
    else if (Array.isArray(json)) campaigns = json;
    else if (json.data && !Array.isArray(json.data)) campaigns = [json.data];

    if (campaigns.length === 0) {
      return [];
    }

    // Group campaigns by type and status
    const typeMap = {};
    campaigns.forEach(c => {
      const rawType = c.type_info?.name || c.type?.name || c.type || c.campaign_type || c.advertising_channel_type || 'UNKNOWN';
      const displayType = mapCampaignType(rawType);
      const status = c.status_info?.name || c.status?.name || c.status || 'UNKNOWN';

      if (!typeMap[displayType]) {
        typeMap[displayType] = { enabled: 0, paused: 0, removed: 0 };
      }

      switch (status.toUpperCase()) {
        case 'ENABLED':
        case 'ACTIVE':
          typeMap[displayType].enabled++;
          break;
        case 'PAUSED':
          typeMap[displayType].paused++;
          break;
        case 'REMOVED':
        case 'DELETED':
          typeMap[displayType].removed++;
          break;
        default:
          typeMap[displayType].removed++;
      }
    });

    // Convert to array format
    return Object.keys(typeMap).map(type => ({
      type: type,
      enabled: typeMap[type].enabled,
      paused: typeMap[type].paused,
      removed: typeMap[type].removed,
      total: typeMap[type].enabled + typeMap[type].paused + typeMap[type].removed
    })).sort((a, b) => b.total - a.total);
  };

  const { data, loading, error } = useApiWithCache(
    activeCampaign?.id,
    period,
    'campaign-progress', // Different endpoint name
    campaignProgressApiCall
  );

  if (loading && !data) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Loading campaign distribution...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-red-600 font-medium mb-2">Error: {error.message}</p>
            <p className="text-sm text-gray-500">Check console for more details</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          <div className="text-center">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            No campaign data available for the selected period.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Campaign Distribution
        </h3>
        <p className="text-sm text-gray-500">
          Campaign status breakdown by type for {period.replace('LAST_', '').replace('_', ' ').toLowerCase()}
        </p>
        <hr className="mt-3" />
      </div>

      {/* Two Row Layout - Progress Bars on Top, Summary Cards on Bottom */}
      <div className="flex flex-col h-96">
        {/* First Row - Progress Bars Section (65% of height) */}
        <div className="flex-1" style={{ flexBasis: '65%' }}>
          <div className="h-full overflow-y-auto space-y-3 pr-2">
            {data.map((item, index) => {
              const enabledPct = (item.enabled / item.total) * 100;
              const pausedPct = (item.paused / item.total) * 100;
              const removedPct = (item.removed / item.total) * 100;

              return (
                <div key={index} className="space-y-2">
                  {/* Type Header */}
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-800 text-sm sm:text-base truncate pr-2">{item.type}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                      Total: {item.total}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-100 rounded h-7 sm:h-8 flex overflow-hidden border border-gray-200">
                    {/* Enabled Section */}
                    {item.enabled > 0 && (
                      <div 
                        className="h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-300 hover:brightness-110"
                        style={{ 
                          width: `${enabledPct}%`,
                          backgroundColor: colors.enabled,
                          minWidth: enabledPct > 0 ? '30px' : '0'
                        }}
                      >
                        {enabledPct > 12 && `${item.enabled}`}
                      </div>
                    )}

                    {/* Paused Section */}
                    {item.paused > 0 && (
                      <div 
                        className="h-full flex items-center justify-center text-white text-xs font-medium transition-all duration-300 hover:brightness-110"
                        style={{ 
                          width: `${pausedPct}%`,
                          backgroundColor: colors.paused,
                          minWidth: pausedPct > 0 ? '30px' : '0'
                        }}
                      >
                        {pausedPct > 12 && `${item.paused}`}
                      </div>
                    )}

                    {/* Removed Section */}
                    {item.removed > 0 && (
                      <div 
                        className="h-full flex items-center justify-center text-gray-700 text-xs font-medium transition-all duration-300 hover:brightness-95"
                        style={{ 
                          width: `${removedPct}%`,
                          backgroundColor: colors.removed,
                          minWidth: removedPct > 0 ? '30px' : '0'
                        }}
                      >
                        {removedPct > 12 && `${item.removed}`}
                      </div>
                    )}
                  </div>

                  {/* Status Details */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600">
                    {item.enabled > 0 && (
                      <span>Enabled: {item.enabled}</span>
                    )}
                    {item.paused > 0 && (
                      <span>Paused: {item.paused}</span>
                    )}
                    {item.removed > 0 && (
                      <span>Removed: {item.removed}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Second Row - Summary Cards in 2x2 Grid (35% of height) */}
        <div className="mt-4" style={{ flexBasis: '35%' }}>
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className="bg-white text-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-start justify-center">
              <div className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide text-center">TOTAL CAMPAIGNS</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-center" style={{ color: "black", width: '100%' }}>
                {data.reduce((sum, item) => sum + item.total, 0)}
              </div>
            </div>
            <div className="bg-white text-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-start justify-center">
              <div className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide text-center">ENABLED</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-center" style={{ color: colors.enabled, width: '100%' }}>
                {data.reduce((sum, item) => sum + item.enabled, 0)}
              </div>
            </div>
            <div className="bg-white text-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-start justify-center">
              <div className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide text-center">PAUSED</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-center" style={{ color: colors.paused, width: '100%' }}>
                {data.reduce((sum, item) => sum + item.paused, 0)}
              </div>
            </div>
            <div className="bg-white text-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col items-start justify-center">
              <div className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide text-center">REMOVED</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-center" style={{ color: colors.removed, width: '100%' }}>
                {data.reduce((sum, item) => sum + item.removed, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignProgressChart;