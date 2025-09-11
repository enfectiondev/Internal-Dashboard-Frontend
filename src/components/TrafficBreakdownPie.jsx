import React, { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { channel, percentage, sessions, users } = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{channel}</p>
        <p>Sessions: {sessions}</p>
        <p>Users: {users}</p>
        <p>Percentage: {percentage.toFixed(2)}%</p>
      </div>
    );
  }
  return null;
};

function TrafficBreakdownPie({ accountId = "417333460", period = "90d" }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSlice, setActiveSlice] = useState(null);

  // ✅ Memoized colors
  const colors = useMemo(
    () => ["#68d5f3", "#0b3140", "#58C3DB", "#9AB4BA", "#B8C9CE"],
    []
  );

  useEffect(() => {
    const fetchTrafficData = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Get token from localStorage
        const token =
          typeof window !== "undefined" && window.localStorage
            ? localStorage.getItem("token")
            : null;

        const headers = {
          "Content-Type": "application/json",
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/traffic-sources/${accountId}?period=${period}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log("Traffic API Response:", json);

        // Map API response into chart data
        const formattedData = json.map((item, index) => ({
          channel: item.channel,
          sessions: item.sessions,
          users: item.users,
          percentage: item.percentage,
          value: item.percentage,
          color: colors[index % colors.length],
        }));

        setData(formattedData);
      } catch (err) {
        console.error("Failed to fetch traffic data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrafficData();
  }, [accountId, period, colors]);

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300">
      <h3 className="font-semibold mb-2 text-gray-900">Traffic Breakdown</h3>
      <hr className="mb-4" />

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading traffic data...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 font-medium mb-2">Error: {error}</p>
          <p className="text-sm text-gray-500">Check console for details</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No traffic data available.
        </div>
      ) : (
        <>
          {/* Pie Chart */}
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
                  {item.channel} ({item.percentage.toFixed(1)}%)
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
