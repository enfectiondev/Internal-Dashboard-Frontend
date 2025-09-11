import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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

function CampaignMetrics() {
  const [campaignData, setCampaignData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClicks, setShowClicks] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined" && window.localStorage
            ? localStorage.getItem("token")
            : null;

        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/campaigns/3220426249?period=LAST_7_DAYS",
          { headers }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();
        console.log("Campaign Metrics API Response:", json);

        let campaigns = [];
        if (json.data && Array.isArray(json.data)) {
          campaigns = json.data;
        } else if (json.campaigns && Array.isArray(json.campaigns)) {
          campaigns = json.campaigns;
        } else if (Array.isArray(json)) {
          campaigns = json;
        } else if (json.data && !Array.isArray(json.data)) {
          campaigns = [json.data];
        }

        const transformed = campaigns.map((c, index) => ({
          name: c.name || c.campaign_name || `Campaign ${index + 1}`,
          clicks: Number(c.clicks || c.click_count || c.clickCount || 0),
          impressions: Number(
            c.impressions || c.impression_count || c.impressionCount || 0
          ),
        }));

        setCampaignData(transformed);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
        setError(err.message);
        setCampaignData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Filter out campaigns with no usable data (based on toggles)
  const filteredData = campaignData.filter((c) => {
    const clicks = showClicks ? c.clicks : 0;
    const impressions = showImpressions ? c.impressions : 0;
    return clicks > 0 || impressions > 0;
  });

  // Check if metrics have any non-zero values at all
  const hasClicksData = campaignData.some((c) => c.clicks > 0);
  const hasImpressionsData = campaignData.some((c) => c.impressions > 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold mb-4 text-gray-900">
          Campaign Performance Metrics
        </h3>
        <div className="flex items-center text-xs text-black">
          {hasClicksData && (
            <div
              className="flex items-center mr-4 select-none"
              onClick={() => setShowClicks((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showClicks ? "#1A4752" : "#ccc" }}
              />
              <span
                style={{
                  cursor: "pointer",
                  transition: "color 0.2s, text-decoration 0.2s",
                  color: showClicks ? "#000" : "#888",
                  textDecoration: showClicks ? "none" : "line-through",
                }}
              >
                Clicks
              </span>
            </div>
          )}
          {hasImpressionsData && (
            <div
              className="flex items-center select-none"
              onClick={() => setShowImpressions((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{
                  backgroundColor: showImpressions ? "#58C3DB" : "#ccc",
                }}
              />
              <span
                style={{
                  cursor: "pointer",
                  transition: "color 0.2s, text-decoration 0.2s",
                  color: showImpressions ? "#000" : "#888",
                  textDecoration: showImpressions ? "none" : "line-through",
                }}
              >
                Impressions
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading campaign metrics...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 font-medium mb-2">Error: {error}</p>
          <p className="text-sm text-gray-500">Check console for more details</p>
        </div>
      ) : filteredData.length === 0 ||
        (!hasClicksData && !hasImpressionsData) ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No campaign data available.
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
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 11, fill: "#000", fontWeight: "bold" }}
            />
            <Tooltip content={<CustomBarTooltip />} />
            {showClicks && hasClicksData && (
              <Bar dataKey="clicks" fill="#1A4752" />
            )}
            {showImpressions && hasImpressionsData && (
              <Bar dataKey="impressions" fill="#58C3DB" />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default CampaignMetrics;
