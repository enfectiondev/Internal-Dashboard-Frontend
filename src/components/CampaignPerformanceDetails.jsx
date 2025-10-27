import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApiWithCache } from "../hooks/useApiWithCache";

// Custom Tooltip
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
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function CampaignPerformanceDetails({ activeCampaign, period, customDates }) {
  const [showCtr, setShowCtr] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [showConversions, setShowConversions] = useState(true);

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

  const campaignDetailsApiCall = async (customerId, period, customDates) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const convertedPeriod = convertPeriodForAPI(period);
    
    let url = `${process.env.REACT_APP_API_BASE_URL}/api/ads/campaigns/${customerId}?period=${convertedPeriod}`;
    
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
      ctr: Number(c.ctr || c.click_through_rate || c.clickThroughRate || 0),
      cost: Number(c.cost || c.spend || c.amount_spent || 0),
      conversions: Number(c.conversions || c.conversion_count || c.conversionCount || 0),
    }));
  };

  const { data, loading, error } = useApiWithCache(
    activeCampaign?.id,
    period,
    'campaign-details',
    campaignDetailsApiCall,
    { customDates }
  );

  // Filter out campaigns with no usable data (based on toggles)
  const filteredData = (data || []).filter((c) => {
    const ctr = showCtr ? c.ctr : 0;
    const cost = showCost ? c.cost : 0;
    const conversions = showConversions ? c.conversions : 0;
    return ctr > 0 || cost > 0 || conversions > 0;
  });

  // Check if metrics have any non-zero values at all
  const hasCtrData = (data || []).some((c) => c.ctr > 0);
  const hasCostData = (data || []).some((c) => c.cost > 0);
  const hasConversionsData = (data || []).some((c) => c.conversions > 0);

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-black">
          Campaign Performance Details
        </h3>
        <div className="flex items-center text-xs space-x-3">
          {hasCtrData && (
            <div
              className="flex items-center select-none"
              onClick={() => setShowCtr((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showCtr ? "#1A4752" : "#ccc" }}
              />
              <span
                style={{
                  ...labelBaseStyle,
                  color: showCtr ? "#000" : "#888",
                  textDecoration: showCtr ? "none" : "line-through",
                }}
              >
                CTR
              </span>
            </div>
          )}
          {hasCostData && (
            <div
              className="flex items-center select-none"
              onClick={() => setShowCost((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showCost ? "#58C3DB" : "#ccc" }}
              />
              <span
                style={{
                  ...labelBaseStyle,
                  color: showCost ? "#000" : "#888",
                  textDecoration: showCost ? "none" : "line-through",
                }}
              >
                Cost
              </span>
            </div>
          )}
          {hasConversionsData && (
            <div
              className="flex items-center select-none"
              onClick={() => setShowConversions((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{
                  backgroundColor: showConversions ? "#9AB4BA" : "#ccc",
                }}
              />
              <span
                style={{
                  ...labelBaseStyle,
                  color: showConversions ? "#000" : "#888",
                  textDecoration: showConversions ? "none" : "line-through",
                }}
              >
                Conversions
              </span>
            </div>
          )}
        </div>
      </div>

      <hr className="mb-4" />

      {(loading && !data) ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading campaign details...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 font-medium mb-2">Error: {error.message}</p>
          <p className="text-sm text-gray-500">Check console for more details</p>
        </div>
      ) : filteredData.length === 0 ||
        (!hasCtrData && !hasCostData && !hasConversionsData) ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No campaign details available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredData} margin={{ left: 50, right: 50 }}>
            <XAxis
              dataKey="name"
              interval={0}
              height={90} // extra space for diagonal multi-line labels
              tick={({ x, y, payload }) => {
                // Split by spaces and further break long words (>10 chars)
                const words = payload.value
                  .split(" ")
                  .flatMap((word) =>
                    word.length > 10 ? word.match(/.{1,10}/g) : [word]
                  );

                return (
                  <g transform={`translate(${x},${y}) rotate(-45)`}>
                    {words.map((word, index) => (
                      <text
                        key={index}
                        x={0}
                        y={index * 12}
                        dy={16}
                        textAnchor="end"
                        fontSize={11}
                        fontWeight="bold"
                        fill="#000"
                      >
                        {word}
                      </text>
                    ))}
                  </g>
                );
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#000", fontWeight: "bold" }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            {showCtr && hasCtrData && <Bar dataKey="ctr" fill="#1A4752" name="CTR" />}
            {showCost && hasCostData && <Bar dataKey="cost" fill="#58C3DB" name="Cost" />}
            {showConversions && hasConversionsData && (
              <Bar dataKey="conversions" fill="#9AB4BA" name="Conversions" />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CampaignPerformanceDetails;