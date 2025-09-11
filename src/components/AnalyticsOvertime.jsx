import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

function AnalyticsOvertime() {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/time-series/417333460?metric=conversions&period=365d",
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = await res.json();

        // Use API data directly, just convert date format
        const transformed = data.map((item) => ({
          date: `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`,
          value: item.value,
        }));

        setTimelineData(transformed);
      } catch (err) {
        console.error("Failed to fetch timeline data:", err);
        setTimelineData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  if (loading)
    return <p className="text-center py-10">Loading timeline data...</p>;

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Analytics Over Time</h3>
      </div>
      <hr className="mb-4" />

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={timelineData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomLineTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22D3EE"
            strokeWidth={3}
            dot={false}
            name="Conversions"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnalyticsOvertime;
