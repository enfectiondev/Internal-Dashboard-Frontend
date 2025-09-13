import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApiWithCache } from "../hooks/useApiWithCache";

// ------------------ Custom Tooltip ------------------
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

const TrafficPerformanceBarChart = ({ activeProperty, period }) => {
  const [showUsers, setShowUsers] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  // Use the universal hook to fetch channel performance data
  const { data: rawData, loading, error } = useApiWithCache(
    activeProperty?.id,
    period,
    'channel-performance',
    async (propertyId, analyticsPeriod) => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/channel-performance/${propertyId}?period=${analyticsPeriod}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: true
    }
  );

  // Transform API data to match recharts format
  const chartData = React.useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    return rawData.map((item) => ({
      channel: item.channel || item.channelGrouping || 'Unknown',
      Users: item.users || 0,
      Sessions: item.sessions || 0,
    }));
  }, [rawData]);

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  if (!activeProperty) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Please select a property to view traffic performance.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading traffic performance...
        </div>
      </div>
    );
  }

  if (error || !chartData.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No traffic performance data available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-black">Traffic Channel Performances</h3>

        {/* Custom Legend */}
        <div className="flex items-center text-sm space-x-4">
          <div
            className="flex items-center select-none cursor-pointer"
            onClick={() => setShowSessions((prev) => !prev)}
          >
            <div
              className="w-4 h-3 mr-2"
              style={{ backgroundColor: showSessions ? "#68d5f3" : "#ccc" }}
            />
            <span style={{ ...labelBaseStyle, color: showSessions ? "#000" : "#888" }}>
              Sessions
            </span>
          </div>

          <div
            className="flex items-center select-none cursor-pointer"
            onClick={() => setShowUsers((prev) => !prev)}
          >
            <div
              className="w-4 h-3 mr-2"
              style={{ backgroundColor: showUsers ? "#0b3140" : "#ccc" }}
            />
            <span style={{ ...labelBaseStyle, color: showUsers ? "#000" : "#888" }}>
              Users
            </span>
          </div>
        </div>
      </div>

      <hr className="mb-4 border-t border-black" />

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="channel"
            tick={{ fontSize: 12, fill: "#000" }}
            axisLine={{ stroke: "#000" }}
            tickLine={{ stroke: "#000" }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12, fill: "#000" }}
            axisLine={{ stroke: "#000" }}
            tickLine={{ stroke: "#000" }}
            domain={[0, "dataMax + 50"]}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#68d5f3" }}
            axisLine={{ stroke: "#68d5f3" }}
            tickLine={{ stroke: "#68d5f3" }}
            domain={[0, "dataMax + 50"]}
          />
          <Tooltip content={<CustomBarTooltip />} />
          {showUsers && <Bar yAxisId="left" dataKey="Users" fill="#0b3140" barSize={40} />}
          {showSessions && <Bar yAxisId="right" dataKey="Sessions" fill="#68d5f3" barSize={40} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrafficPerformanceBarChart;