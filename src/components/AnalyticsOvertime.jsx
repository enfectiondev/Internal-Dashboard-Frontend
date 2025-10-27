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

function AnalyticsOvertime({ activeProperty, period, customDates }) {
  const [showTotalUsers, setShowTotalUsers] = useState(true);
  const [showSessions, setShowSessions] = useState(true);
  const [showConversions, setShowConversions] = useState(true);

  // Fetch Total Users data
  const { data: totalUsersData, loading: loadingUsers } = useApiWithCache(
    activeProperty?.id,
    period,
    'time-series-totalUsers',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/analytics/time-series/${propertyId}?metric=totalUsers&period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDatesParam?.startDate && customDatesParam?.endDate) {
        url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
      }
      
      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: false,
      customDates
    }
  );

  // Fetch Sessions data
  const { data: sessionsData, loading: loadingSessions } = useApiWithCache(
    activeProperty?.id,
    period,
    'time-series-sessions',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/analytics/time-series/${propertyId}?metric=sessions&period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDatesParam?.startDate && customDatesParam?.endDate) {
        url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
      }
      
      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: false,
      customDates
    }
  );

  // Fetch Conversions data
  const { data: conversionsData, loading: loadingConversions } = useApiWithCache(
    activeProperty?.id,
    period,
    'time-series-conversions',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `https://3ixmj4hf2a.us-east-2.awsapprunner.com/api/analytics/time-series/${propertyId}?metric=conversions&period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDatesParam?.startDate && customDatesParam?.endDate) {
        url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
      }
      
      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: false,
      customDates
    }
  );

  // Combine all data into single timeline
  const timelineData = React.useMemo(() => {
    if (!totalUsersData && !sessionsData && !conversionsData) return [];

    // Create a map of dates to combine data
    const dateMap = new Map();

    // Process Total Users data
    if (totalUsersData && Array.isArray(totalUsersData)) {
      totalUsersData.forEach(item => {
        const date = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date).totalUsers = item.value || 0;
      });
    }

    // Process Sessions data
    if (sessionsData && Array.isArray(sessionsData)) {
      sessionsData.forEach(item => {
        const date = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date).sessions = item.value || 0;
      });
    }

    // Process Conversions data
    if (conversionsData && Array.isArray(conversionsData)) {
      conversionsData.forEach(item => {
        const date = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
        if (!dateMap.has(date)) {
          dateMap.set(date, { date });
        }
        dateMap.get(date).conversions = item.value || 0;
      });
    }

    // Convert map to array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        date: item.date,
        totalUsers: item.totalUsers || 0,
        sessions: item.sessions || 0,
        conversions: item.conversions || 0,
      }));
  }, [totalUsersData, sessionsData, conversionsData]);

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  const isLoading = loadingUsers || loadingSessions || loadingConversions;

  if (!activeProperty) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Please select a property to view analytics over time.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading analytics data...
        </div>
      </div>
    );
  }

  if (!timelineData.length) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No analytics data available.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Analytics Over Time</h3>

        {/* Custom Clickable Legend */}
        <div className="flex items-center text-xs">
          <div
            className="flex items-center mr-4 select-none cursor-pointer"
            onClick={() => setShowTotalUsers((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showTotalUsers ? "#374151" : "#ccc" }}
            ></div>
            <span
              style={{
                ...labelBaseStyle,
                color: showTotalUsers ? "#000" : "#888",
                textDecoration: showTotalUsers ? "none" : "line-through",
              }}
            >
              Total Users
            </span>
          </div>

          <div
            className="flex items-center mr-4 select-none cursor-pointer"
            onClick={() => setShowSessions((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showSessions ? "#9CA3AF" : "#ccc" }}
            ></div>
            <span
              style={{
                ...labelBaseStyle,
                color: showSessions ? "#000" : "#888",
                textDecoration: showSessions ? "none" : "line-through",
              }}
            >
              Sessions
            </span>
          </div>

          <div
            className="flex items-center select-none cursor-pointer"
            onClick={() => setShowConversions((prev) => !prev)}
          >
            <div
              className="w-3 h-3 mr-1"
              style={{ backgroundColor: showConversions ? "#22D3EE" : "#ccc" }}
            ></div>
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
        </div>
      </div>
      <hr className="mb-4" />

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={timelineData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomLineTooltip />} />

          {showTotalUsers && (
            <Line 
              type="monotone" 
              dataKey="totalUsers" 
              stroke="#374151" 
              strokeWidth={3} 
              dot={false} 
              name="Total Users" 
            />
          )}
          {showSessions && (
            <Line 
              type="monotone" 
              dataKey="sessions" 
              stroke="#9CA3AF" 
              strokeWidth={3} 
              dot={false} 
              name="Sessions" 
            />
          )}
          {showConversions && (
            <Line 
              type="monotone" 
              dataKey="conversions" 
              stroke="#22D3EE" 
              strokeWidth={3} 
              dot={false} 
              name="Conversions" 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnalyticsOvertime;