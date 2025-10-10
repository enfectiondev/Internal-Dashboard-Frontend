
// FacebookMetricsChart.jsx - New Line Chart Component
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function FacebookMetricsChart({ timeseriesData, isLoading }) {
  const [selectedMetric, setSelectedMetric] = useState("impressions");

  const metricOptions = [
    { value: "impressions", label: "Impressions", color: "#8b5cf6" },
    { value: "unique_impressions", label: "Unique Impressions", color: "#6366f1" },
    { value: "post_engagements", label: "Post Engagements", color: "#10b981" },
    { value: "engaged_users", label: "Engaged Users", color: "#f59e0b" },
    { value: "page_views", label: "Page Views", color: "#ec4899" },
    { value: "new_likes", label: "New Likes", color: "#14b8a6" },
    { value: "fans", label: "Total Fans", color: "#ef4444" }
  ];

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-80 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!timeseriesData || !timeseriesData.timeseries || timeseriesData.timeseries.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metrics Over Time</h3>
        <div className="flex items-center justify-center h-80 text-gray-500">
          No data available for the selected period
        </div>
      </div>
    );
  }

  const currentMetric = metricOptions.find(m => m.value === selectedMetric);

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare chart data
  const chartData = timeseriesData.timeseries.map(item => ({
    date: formatDate(item.date),
    value: item[selectedMetric] || 0,
    fullDate: item.date
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.fullDate}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium" style={{ color: currentMetric.color }}>
              {currentMetric.label}:
            </span>{" "}
            {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Metrics Over Time</h3>
        
        {/* Metric Selector Dropdown */}
        <div className="relative">
          <label htmlFor="metric-select" className="sr-only">Select Metric</label>
          <select
            id="metric-select"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="block w-full sm:w-64 px-4 py-2 pr-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0f4653] focus:border-transparent"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={() => currentMetric.label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={currentMetric.color}
            strokeWidth={2}
            dot={{ fill: currentMetric.color, r: 4 }}
            activeDot={{ r: 6 }}
            name={currentMetric.label}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Summary Stats Below Chart */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Average</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.round(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Peak</p>
          <p className="text-lg font-bold text-gray-900">
            {Math.max(...chartData.map(item => item.value)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Days</p>
          <p className="text-lg font-bold text-gray-900">
            {chartData.length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default FacebookMetricsChart;