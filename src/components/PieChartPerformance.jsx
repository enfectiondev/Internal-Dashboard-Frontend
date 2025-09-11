import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{name}</p>
        <p>Value: {value}</p>
      </div>
    );
  }
  return null;
};

function PieChartPerformance({ campaignId = "3220426249" }) {
  const [outerData, setOuterData] = useState([]);
  const [innerData, setInnerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOuter, setActiveOuter] = useState(null);

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get token from localStorage if available, but don't fail if not present
        const token = typeof window !== 'undefined' && window.localStorage ? 
          localStorage.getItem("token") : null;
        
        const headers = {
          "Content-Type": "application/json"
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/campaigns/${campaignId}?period=LAST_7_DAYS`,
          { headers }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const json = await response.json();
        console.log('Pie Chart API Response:', json);

        // Handle different possible response structures
        let campaigns = [];
        if (json.data && Array.isArray(json.data)) {
          campaigns = json.data;
        } else if (json.campaigns && Array.isArray(json.campaigns)) {
          campaigns = json.campaigns;
        } else if (Array.isArray(json)) {
          campaigns = json;
        } else if (json.data && !Array.isArray(json.data)) {
          // Single campaign object
          campaigns = [json.data];
        }

        // Outer pie data - group by status
        const statusMap = {};
        campaigns.forEach((c) => {
          const statusName = c.status_info?.name || c.status?.name || c.status || "UNKNOWN";
          statusMap[statusName] = (statusMap[statusName] || 0) + 1;
        });

        const outer = Object.keys(statusMap).map((key) => ({
          name: key,
          value: statusMap[key],
          color:
            key === "ENABLED" || key === "ACTIVE"
              ? "#0f766e"
              : key === "PAUSED"
              ? "#fbbf24"
              : key === "REMOVED" || key === "DELETED"
              ? "#0284c7"
              : "#888",
        }));

        // Inner pie data - show campaign types within status
        const inner = campaigns.map((c, index) => {
          const statusName = c.status_info?.name || c.status?.name || c.status || "UNKNOWN";
          const typeName = c.type_info?.name || c.type?.name || c.type || c.campaign_type || `Type ${index + 1}`;
          const statusColor =
            statusName === "ENABLED" || statusName === "ACTIVE"
              ? "#0d9488"
              : statusName === "PAUSED"
              ? "#fbbf24"
              : statusName === "REMOVED" || statusName === "DELETED"
              ? "#0284c7"
              : "#888";
          return {
            name: `${typeName} (${statusName})`,
            value: 1,
            parent: statusName,
            color: statusColor,
          };
        });

        setOuterData(outer);
        setInnerData(inner);
      } catch (error) {
        console.error("Failed to fetch campaign data:", error);
        setError(error.message);
        setOuterData([]);
        setInnerData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [campaignId]);

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300">
      <h3 className="font-semibold mb-2 text-gray-900">Campaign Status Distribution</h3>
      <hr className="mb-4" />

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading campaign status...
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 font-medium mb-2">Error: {error}</p>
          <p className="text-sm text-gray-500">Check console for more details</p>
        </div>
      ) : outerData.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No campaign data available.
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                {/* Outer pie */}
                <Pie
                  data={outerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={1}
                  onClick={(entry) =>
                    setActiveOuter(activeOuter === entry.name ? null : entry.name)
                  }
                >
                  {outerData.map((entry, index) => (
                    <Cell
                      key={`outer-${index}`}
                      fill={entry.color}
                      opacity={
                        !activeOuter || activeOuter === entry.name ? 1 : 0.3
                      }
                    />
                  ))}
                </Pie>

                {/* Inner pie */}
                <Pie
                  data={innerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={1}
                >
                  {innerData.map((entry, index) => (
                    <Cell
                      key={`inner-${index}`}
                      fill={entry.color}
                      opacity={
                        !activeOuter || activeOuter === entry.parent ? 1 : 0.3
                      }
                    />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="mt-4 text-xs flex flex-wrap justify-center">
            {outerData.map((item, index) => (
              <div
                key={index}
                className="flex items-center mr-3 mb-1 select-none cursor-pointer"
                onClick={() =>
                  setActiveOuter(activeOuter === item.name ? null : item.name)
                }
              >
                <div
                  className="w-3 h-3 mr-1"
                  style={{
                    backgroundColor: item.color,
                    opacity: !activeOuter || activeOuter === item.name ? 1 : 0.3,
                  }}
                ></div>
                <span
                  style={{
                    color: !activeOuter || activeOuter === item.name ? "#000" : "#888",
                    textDecoration:
                      !activeOuter || activeOuter === item.name ? "none" : "line-through",
                  }}
                >
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default PieChartPerformance;