import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApiWithCache } from "../hooks/useApiWithCache";

// Custom Tooltip
const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center">
            <span
              className="w-3 h-3 mr-1 rounded-sm"
              style={{ backgroundColor: entry.stroke }}
            ></span>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function LineChartComp({ activeCampaign, period, customDates }) {
  const [showClicks, setShowClicks] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);

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

  const timelineApiCall = async (customerId, period, customDates) => {
    const token = localStorage.getItem("token");
    const convertedPeriod = convertPeriodForAPI(period);

    let url = `${process.env.REACT_APP_API_BASE_URL}/api/ads/time-performance/${customerId}?period=${convertedPeriod}`;
    
    if (convertedPeriod === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }

    const response = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
    return await response.json();
  };

  const { data: timelineData, loading, error } = useApiWithCache(
    activeCampaign?.id,
    period,
    'time-performance',
    timelineApiCall,
    { customDates }
  );

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  if (loading && !timelineData) return <p>Loading timeline data...</p>;

  if (error) return <p>Error loading timeline data: {error.message}</p>;
  if (!timelineData?.length) return <p>No timeline data available.</p>;

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Performance Over Time</h3>

        {/* Custom Clickable Legend */}
        <div className="flex items-center text-xs">
          <div
            className="flex items-center mr-4 select-none"
            onClick={() => setShowClicks((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showClicks ? "#374151" : "#ccc" }}
            ></div>
            <span
              style={{
                ...labelBaseStyle,
                color: showClicks ? "#000" : "#888",
                textDecoration: showClicks ? "none" : "line-through",
              }}
            >
              Clicks
            </span>
          </div>

          <div
            className="flex items-center mr-4 select-none"
            onClick={() => setShowCost((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showCost ? "#0d9488" : "#ccc" }}
            ></div>
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

          <div
            className="flex items-center select-none"
            onClick={() => setShowImpressions((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showImpressions ? "#38bdf8" : "#ccc" }}
            ></div>
            <span
              style={{
                ...labelBaseStyle,
                color: showImpressions ? "#000" : "#888",
                textDecoration: showImpressions ? "none" : "line-through",
              }}
            >
              Impressions
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={timelineData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomLineTooltip />} />

          {showClicks && <Line type="monotone" dataKey="clicks" stroke="#374151" strokeWidth={3} dot={false} name="Clicks" />}
          {showCost && <Line type="monotone" dataKey="cost" stroke="#0d9488" strokeWidth={3} dot={false} name="Cost" />}
          {showImpressions && <Line type="monotone" dataKey="impressions" stroke="#38bdf8" strokeWidth={3} dot={false} name="Impressions" />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartComp;