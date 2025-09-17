import React, { useState, useMemo } from "react";
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
            {entry.name}: {entry.value?.toLocaleString() || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function SearchesOverTimeChart({ selectedAccount, selectedCountry, seedKeywords, apiData }) {
  // Transform API data or use dummy data as fallback
  const timelineData = useMemo(() => {
    if (!apiData?.historical_metrics_raw?.results) {
      // Fallback dummy data for individual keywords
      return [
        { date: "2024-01", BOC: 1200, HNB: 1350, Sampath: 1180 },
        { date: "2024-02", BOC: 1350, HNB: 1400, Sampath: 1250 },
        { date: "2024-03", BOC: 1180, HNB: 1200, Sampath: 1320 },
        { date: "2024-04", BOC: 1420, HNB: 1500, Sampath: 1400 },
        { date: "2024-05", BOC: 1650, HNB: 1700, Sampath: 1550 },
        { date: "2024-06", BOC: 1580, HNB: 1600, Sampath: 1620 },
        { date: "2024-07", BOC: 1720, HNB: 1750, Sampath: 1680 },
        { date: "2024-08", BOC: 1890, HNB: 1900, Sampath: 1850 },
        { date: "2024-09", BOC: 1750, HNB: 1780, Sampath: 1720 },
        { date: "2024-10", BOC: 1920, HNB: 1950, Sampath: 1890 },
        { date: "2024-11", BOC: 2100, HNB: 2150, Sampath: 2050 },
        { date: "2024-12", BOC: 2050, HNB: 2100, Sampath: 2000 }
      ];
    }

    // Transform API data
    const results = apiData.historical_metrics_raw.results;
    if (results.length === 0) return [];

    // Get all unique months from all keywords
    const allMonths = new Set();
    results.forEach(result => {
      result.keyword_metrics.monthly_search_volumes?.forEach(volume => {
        const monthKey = `${volume.year}-${volume.month.toString().padStart(2, '0')}`;
        allMonths.add(monthKey);
      });
    });

    const sortedMonths = Array.from(allMonths).sort();

    // Create chart data structure
    return sortedMonths.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });

      const dataPoint = { 
        date: monthName
      };

      // Add search volume for each keyword
      results.forEach(result => {
        const keywordText = result.keyword_text;
        const monthData = result.keyword_metrics.monthly_search_volumes?.find(
          volume => `${volume.year}-${volume.month.toString().padStart(2, '0')}` === monthKey
        );
        dataPoint[keywordText] = monthData ? monthData.monthly_searches : 0;
      });

      return dataPoint;
    });
  }, [apiData]);

  // Get keyword names for dynamic line rendering
  const keywordNames = useMemo(() => {
    if (!apiData?.historical_metrics_raw?.results) {
      return ['BOC', 'HNB', 'Sampath']; // fallback
    }
    return apiData.historical_metrics_raw.results.map(result => result.keyword_text);
  }, [apiData]);

  // Colors for each keyword line
  const keywordColors = ['#508995', '#0E4854', '#94A3B8', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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
          
          {/* Keyword Legend */}
          <div className="flex items-center text-xs">
            {keywordNames.map((keyword, index) => (
              <div key={keyword} className="flex items-center mr-4 select-none">
                <div
                  className="w-3 h-3 mr-1"
                  style={{ backgroundColor: keywordColors[index % keywordColors.length] }}
                ></div>
                <span style={{ color: "#000" }}>
                  {keyword.toUpperCase()}
                </span>
              </div>
            ))}
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

              {keywordNames.map((keyword, index) => (
                <Line 
                  key={keyword}
                  type="monotone" 
                  dataKey={keyword} 
                  stroke={keywordColors[index % keywordColors.length]} 
                  strokeWidth={3} 
                  dot={false} 
                  name={keyword.toUpperCase()} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="text-sm text-gray-500">
            {apiData 
              ? `Showing search trends for ${keywordNames.join(', ')} in ${selectedCountry}`
              : "Showing search trends for selected keywords over the last 12 months"
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchesOverTimeChart;