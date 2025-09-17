import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useApiWithCache } from "../hooks/useApiWithCache";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { channel, percentage, sessions, users } = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{channel}</p>
        <p>Sessions: {sessions?.toLocaleString() || 0}</p>
        <p>Users: {users?.toLocaleString() || 0}</p>
        <p>Percentage: {percentage?.toFixed(2) || 0}%</p>
      </div>
    );
  }
  return null;
};

function TrafficBreakdownPie({ activeProperty, period }) {
  const [activeSlice, setActiveSlice] = useState(null);

  // Memoized colors
  const colors = useMemo(
    () => ["#68d5f3", "#0b3140", "#58C3DB", "#9AB4BA", "#B8C9CE"],
    []
  );

  // Use the universal hook to fetch traffic sources data
  const { data: rawData, loading, error } = useApiWithCache(
    activeProperty?.id,
    period,
    'traffic-sources',
    async (propertyId, analyticsPeriod) => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/traffic-sources/${propertyId}?period=${analyticsPeriod}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: true
    }
  );

  // Process and format the data
  const data = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return [];
    
    return rawData.map((item, index) => ({
      channel: item.channel || item.channelGrouping || 'Unknown',
      sessions: item.sessions || 0,
      users: item.users || 0,
      percentage: item.percentage || 0,
      value: item.percentage || 0,
      color: colors[index % colors.length],
    }));
  }, [rawData, colors]);

  if (!activeProperty) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300">
        <h3 className="font-semibold mb-2 text-gray-900">Traffic Breakdown</h3>
        <hr className="mb-4" />
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Please select a property to view traffic breakdown.
        </div>
      </div>
    );
  }

return (
  <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300 h-full flex flex-col">
    <h3 className="font-semibold mb-2 text-gray-900">Traffic Breakdown</h3>
    <hr className="mb-4" />

    {loading ? (
      <div className="flex justify-center items-center flex-1 text-gray-500 font-medium">
        Loading traffic data...
      </div>
    ) : error ? (
      <div className="flex flex-col justify-center items-center flex-1">
        <p className="text-red-500 font-medium mb-2">
          Error: {error.message || "Failed to load data"}
        </p>
        <p className="text-sm text-gray-500">Check console for details</p>
      </div>
    ) : data.length === 0 ? (
      <div className="flex justify-center items-center flex-1 text-gray-500 font-medium">
        No traffic data available.
      </div>
    ) : (
      <>
        {/* Pie Chart */}
        <div className="flex-1 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="channel"
                cx="50%"
                cy="50%"
                innerRadius="40%"
                outerRadius="70%"
                paddingAngle={2}
                onClick={(entry) =>
                  setActiveSlice(activeSlice === entry.channel ? null : entry.channel)
                }
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={!activeSlice || activeSlice === entry.channel ? 1 : 0.3}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {/* Center Text */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-blue-400 text-xs font-medium"
              >
                Majority
              </text>
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-black text-sm font-bold"
              >
                {data.length > 0
                  ? data.reduce((max, item) =>
                      item.percentage > max.percentage ? item : max
                    ).channel
                  : ""}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 text-xs flex flex-wrap justify-center">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center mr-3 mb-1 cursor-pointer select-none"
              onClick={() =>
                setActiveSlice(activeSlice === item.channel ? null : item.channel)
              }
            >
              <div
                className="w-3 h-3 mr-1"
                style={{
                  backgroundColor: item.color,
                  opacity: !activeSlice || activeSlice === item.channel ? 1 : 0.3,
                }}
              ></div>
              <span
                style={{
                  color: !activeSlice || activeSlice === item.channel ? "#000" : "#888",
                  textDecoration:
                    !activeSlice || activeSlice === item.channel ? "none" : "line-through",
                }}
              >
                {item.channel} ({item.percentage?.toFixed(1) || 0}%)
              </span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

}

export default TrafficBreakdownPie;