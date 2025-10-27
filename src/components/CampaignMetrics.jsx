import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { useApiWithCache } from "../hooks/useApiWithCache";

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center">
            <span
              className="w-3 h-3 mr-1 rounded-sm"
              style={{ backgroundColor: entry.fill }}
            ></span>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function CampaignMetrics({ activeCampaign, period, customDates }) {
  const [showClicks, setShowClicks] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);

  // Convert period format for API compatibility
  const convertPeriodForAPI = (period) => {
    const periodMap = {
      'LAST_7_DAYS': 'LAST_7_DAYS',
      'LAST_30_DAYS': 'LAST_30_DAYS',
      'LAST_3_MONTHS': 'LAST_90_DAYS',
      'LAST_1_YEAR': 'LAST_365_DAYS',
      'CUSTOM': 'CUSTOM'
    };
    return periodMap[period] || period;
  };

  const campaignsApiCall = async (customerId, period, customDates) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const convertedPeriod = convertPeriodForAPI(period);
    
    // Build URL with custom date parameters if period is CUSTOM
    let url = `${import.meta.env.VITE_API_BASE_URL}/api/ads/campaigns/${customerId}?period=${convertedPeriod}`;
    
    if (convertedPeriod === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();

    let campaigns = [];
    if (json.data && Array.isArray(json.data)) campaigns = json.data;
    else if (json.campaigns && Array.isArray(json.campaigns)) campaigns = json.campaigns;
    else if (Array.isArray(json)) campaigns = json;
    else if (json.data && !Array.isArray(json.data)) campaigns = [json.data];

    return campaigns.map((c, index) => ({
      name: c.name || c.campaign_name || `Campaign ${index + 1}`,
      clicks: Number(c.clicks || c.click_count || c.clickCount || 0),
      impressions: Number(c.impressions || c.impression_count || c.impressionCount || 0),
    }));
  };

  const { data: campaignData, loading, error } = useApiWithCache(
    activeCampaign?.id,
    period,
    'campaigns-shared',
    campaignsApiCall,
    { customDates } // Pass custom dates to the hook
  );

  // Filter out campaigns with no usable data (based on toggles)
  const filteredData = (campaignData || []).filter((c) => {
    const clicks = showClicks ? c.clicks : 0;
    const impressions = showImpressions ? c.impressions : 0;
    return clicks > 0 || impressions > 0;
  });

  // Check if metrics have any non-zero values at all
  const hasClicksData = (campaignData || []).some((c) => c.clicks > 0);
  const hasImpressionsData = (campaignData || []).some((c) => c.impressions > 0);

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  // Format period display text
  const getPeriodDisplayText = () => {
    if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      return `${customDates.startDate} to ${customDates.endDate}`;
    }
    return period.replace('LAST_', '').replace('_', ' ').toLowerCase();
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300 h-full">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold mb-4 text-gray-900">
            Campaign Performance Metrics
            {activeCampaign?.name && (
              <span className="text-sm font-normal text-gray-600 block">
                {activeCampaign.name} - {getPeriodDisplayText()}
              </span>
            )}
          </h3>

          {/* Clickable Legend */}
          <div className="flex items-center text-xs text-black">
            {hasClicksData && (
              <div
                className="flex items-center mr-4 select-none"
                style={{ cursor: "pointer" }}
                onClick={() => setShowClicks((prev) => !prev)}
              >
                <div
                  className="w-3 h-3 mr-1"
                  style={{
                    backgroundColor: showClicks ? "#1A4752" : "#ccc",
                  }}
                ></div>
                <span
                  style={{
                    ...labelBaseStyle,
                    color: showClicks ? "#000" : "#888",
                    textDecoration: showClicks ? "none" : "line-through",
                  }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                  onMouseLeave={(e) =>
                    (e.target.style.textDecoration = showClicks ? "none" : "line-through")
                  }
                >
                  Clicks
                </span>
              </div>
            )}

            {hasImpressionsData && (
              <div
                className="flex items-center select-none"
                style={{ cursor: "pointer" }}
                onClick={() => setShowImpressions((prev) => !prev)}
              >
                <div
                  className="w-3 h-3 mr-1"
                  style={{
                    backgroundColor: showImpressions ? "#58C3DB" : "#ccc",
                  }}
                ></div>
                <span
                  style={{
                    ...labelBaseStyle,
                    color: showImpressions ? "#000" : "#888",
                    textDecoration: showImpressions ? "none" : "line-through",
                  }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                  onMouseLeave={(e) =>
                    (e.target.style.textDecoration = showImpressions ? "none" : "line-through")
                  }
                >
                  Impressions
                </span>
              </div>
            )}
          </div>
        </div>

        <hr className="mb-4 border-t-1 border-black" />
      </div>

      {loading && !campaignData ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading campaign metrics...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 font-medium mb-2">Error: {error.message}</p>
          <p className="text-sm text-gray-500">Check console for more details</p>
        </div>
      ) : filteredData.length === 0 ||
        (!hasClicksData && !hasImpressionsData) ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No campaign data available for the selected period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={filteredData}
            layout="vertical"
            barGap={5}
            margin={{ top: 10, right: 20, left: 100, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="#ccc" />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#000000", fontWeight: "bold" }}
              hide
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fill: "#000000", fontWeight: "bold" }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <ReferenceLine y={2.5} stroke="#3b82f6" strokeDasharray="2 2" />

            {showClicks && hasClicksData && (
              <Bar dataKey="clicks" fill="#1A4752" name="Clicks" />
            )}
            {showImpressions && hasImpressionsData && (
              <Bar dataKey="impressions" fill="#58C3DB" name="Impressions" />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CampaignMetrics;