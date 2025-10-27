import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function MetaPlacementsChart({ selectedCampaigns, period, customDates, facebookToken, currency = "MYR" }) {
  const [placementsData, setPlacementsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("spend");

  // Map frontend period values to backend expected values
  const mapPeriodToBackend = (frontendPeriod) => {
    const periodMap = {
      LAST_7_DAYS: "7d",
      LAST_30_DAYS: "30d",
      LAST_90_DAYS: "90d",
      LAST_365_DAYS: "365d",
    };
    return periodMap[frontendPeriod] || "90d";
  };

  useEffect(() => {
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      fetchPlacementsData();
    }
  }, [selectedCampaigns, period, customDates]);

  const fetchPlacementsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem("facebook_token");
      if (!token) throw new Error("No Facebook token available");

      const campaignIds = selectedCampaigns.map((c) => c.campaign_id);

      let url = `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/meta/campaigns/placements`;
      const params = new URLSearchParams();

      if (period === "CUSTOM" && customDates?.startDate && customDates?.endDate) {
        params.append("start_date", customDates.startDate);
        params.append("end_date", customDates.endDate);
      } else {
        params.append("period", mapPeriodToBackend(period));
      }

      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(campaignIds),
      });

      if (!response.ok) throw new Error(`Failed to fetch placements data: ${response.status}`);

      const data = await response.json();
      setPlacementsData(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching placements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const processBarChartData = () => {
    if (!placementsData || placementsData.length === 0) return [];

    const platformMap = new Map();

    placementsData.forEach((campaign) => {
      const campaignName =
        selectedCampaigns.find((c) => c.campaign_id === campaign.campaign_id)?.campaign_name ||
        campaign.campaign_id;

      campaign.placements.forEach((placement) => {
        const key = placement.platform;
        if (!platformMap.has(key)) {
          platformMap.set(key, { platform: key.charAt(0).toUpperCase() + key.slice(1) });
        }
        const entry = platformMap.get(key);
        entry[campaignName] = placement[selectedMetric];
      });
    });

    return Array.from(platformMap.values());
  };

  const barChartData = processBarChartData();
  const COLORS = ["#1A4752", "#508995", "#22C55E", "#F59E0B", "#8B5CF6", "#EF4444"];

  const getBarColor = (index) => COLORS[index % COLORS.length];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {payload[0].payload.platform || payload[0].name}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-700">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              {selectedMetric === "spend"
                ? `${currency} ${Number(entry.value).toFixed(2)}`
                : Number(entry.value).toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading placements data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Platform Placements</h3>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
        <div className="flex flex-wrap gap-2">
          {["spend", "impressions", "reach"].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                selectedMetric === metric
                  ? "bg-[#508995] text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      {barChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            layout="vertical"
            data={barChartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) =>
                selectedMetric === "spend"
                  ? `${currency} ${Number(value).toFixed(2)}`
                  : Number(value).toLocaleString()
              }
            />
            <YAxis
              type="category"
              dataKey="platform"
              stroke="#6B7280"
              style={{ fontSize: "12px" }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            {selectedCampaigns.map((campaign, index) => (
              <Bar
                key={campaign.campaign_id}
                dataKey={campaign.campaign_name}
                fill={getBarColor(index)}
                name={campaign.campaign_name}
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No placements data available for the selected campaigns.</p>
        </div>
      )}
    </div>
  );
}

export default MetaPlacementsChart;
