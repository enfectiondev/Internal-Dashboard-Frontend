import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function LineChartComp() {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClicks, setShowClicks] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [showImpressions, setShowImpressions] = useState(true);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/time-performance/3220426249?period=LAST_7_DAYS",
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);

        const data = await response.json();
        setTimelineData(data); // API returns array
      } catch (error) {
        console.error("Failed to fetch timeline data:", error);
        setTimelineData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  if (loading) return <p>Loading timeline data...</p>;
  if (timelineData.length === 0) return <p>No timeline data available.</p>;

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

          {showClicks && <Line type="monotone" dataKey="clicks" stroke="#374151" strokeWidth={3} dot={false} />}
          {showCost && <Line type="monotone" dataKey="cost" stroke="#0d9488" strokeWidth={3} dot={false} />}
          {showImpressions && <Line type="monotone" dataKey="impressions" stroke="#38bdf8" strokeWidth={3} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartComp;
