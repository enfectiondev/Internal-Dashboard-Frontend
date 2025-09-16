import React, { useState } from "react";
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

function SearchesOverTimeChart({ selectedAccount, selectedCountry, seedKeywords }) {
  const [showSearchVolume, setShowSearchVolume] = useState(true);
  const [showCompetition, setShowCompetition] = useState(true);
  const [showCPC, setShowCPC] = useState(true);

  // Dummy data - replace with actual API call
  const timelineData = [
    { date: "2024-01", searchVolume: 1200, competition: 65, cpc: 0.45 },
    { date: "2024-02", searchVolume: 1350, competition: 68, cpc: 0.52 },
    { date: "2024-03", searchVolume: 1180, competition: 70, cpc: 0.48 },
    { date: "2024-04", searchVolume: 1420, competition: 72, cpc: 0.55 },
    { date: "2024-05", searchVolume: 1650, competition: 75, cpc: 0.61 },
    { date: "2024-06", searchVolume: 1580, competition: 73, cpc: 0.58 },
    { date: "2024-07", searchVolume: 1720, competition: 76, cpc: 0.63 },
    { date: "2024-08", searchVolume: 1890, competition: 78, cpc: 0.67 },
    { date: "2024-09", searchVolume: 1750, competition: 74, cpc: 0.59 },
    { date: "2024-10", searchVolume: 1920, competition: 80, cpc: 0.71 },
    { date: "2024-11", searchVolume: 2100, competition: 82, cpc: 0.74 },
    { date: "2024-12", searchVolume: 2050, competition: 79, cpc: 0.69 }
  ];

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  return (
    <div className="w-full bg-white rounded-2xl p-2 shadow-sm">
      <div className="bg-white overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            Searches Over Time
          </h2>
          
          {/* Custom Clickable Legend */}
          <div className="flex items-center text-xs">
            <div
              className="flex items-center mr-4 select-none"
              onClick={() => setShowSearchVolume((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showSearchVolume ? "#508995" : "#ccc" }}
              ></div>
              <span
                style={{
                  ...labelBaseStyle,
                  color: showSearchVolume ? "#000" : "#888",
                  textDecoration: showSearchVolume ? "none" : "line-through",
                }}
              >
                Search Volume
              </span>
            </div>

            <div
              className="flex items-center mr-4 select-none"
              onClick={() => setShowCompetition((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showCompetition ? "#0E4854" : "#ccc" }}
              ></div>
              <span
                style={{
                  ...labelBaseStyle,
                  color: showCompetition ? "#000" : "#888",
                  textDecoration: showCompetition ? "none" : "line-through",
                }}
              >
                Competition Index
              </span>
            </div>

            <div
              className="flex items-center select-none"
              onClick={() => setShowCPC((prev) => !prev)}
            >
              <div
                className="w-3 h-3 mr-1"
                style={{ backgroundColor: showCPC ? "#F1ECEC" : "#ccc" }}
              ></div>
              <span
                style={{
                  ...labelBaseStyle,
                  color: showCPC ? "#000" : "#888",
                  textDecoration: showCPC ? "none" : "line-through",
                }}
              >
                Avg. CPC ($)
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                stroke="#6B7280"
              />
              <Tooltip content={<CustomLineTooltip />} />

              {showSearchVolume && (
                <Line 
                  type="monotone" 
                  dataKey="searchVolume" 
                  stroke="#508995" 
                  strokeWidth={3} 
                  dot={false} 
                  name="Search Volume" 
                />
              )}
              {showCompetition && (
                <Line 
                  type="monotone" 
                  dataKey="competition" 
                  stroke="#0E4854" 
                  strokeWidth={3} 
                  dot={false} 
                  name="Competition Index" 
                />
              )}
              {showCPC && (
                <Line 
                  type="monotone" 
                  dataKey="cpc" 
                  stroke="#94A3B8" 
                  strokeWidth={3} 
                  dot={false} 
                  name="Avg. CPC ($)" 
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="text-sm text-gray-500">
            Showing search trends for selected keywords over the last 12 months
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchesOverTimeChart;