import React, { useState, useRef, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { useApiWithCache } from "../hooks/useApiWithCache";

const colors = ["#1A4752", "#2B889C", "#A0C6CE", "#58C3DB"];

function DevicePerformancePie({ activeCampaign, activeProperty, period, isAnalytics = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);
  const [size, setSize] = useState(200); // dynamic chart size
  const containerRef = useRef(null);

  // ResizeObserver to keep pie circular
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setSize(Math.min(width, height));
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Determine which ID to use and API call function
  const currentId = isAnalytics ? activeProperty?.id : activeCampaign?.id;
  const apiCallFunction = isAnalytics
    ? async (propertyId, analyticsPeriod) => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/audience-insights/${propertyId}?dimension=deviceCategory&period=${analyticsPeriod}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return await res.json();
      }
    : async (customerId, adsPeriod) => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/device-performance/${customerId}?period=${adsPeriod}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return await res.json();
      };

  // Use the universal hook with appropriate options
  const { data: rawData, loading, error } = useApiWithCache(
    currentId,
    period,
    isAnalytics ? "audience-insights" : "device-performance",
    apiCallFunction,
    {
      isAnalytics,
      convertPeriod: isAnalytics, // Only convert period for analytics
    }
  );

  // Process the data into chart format
  const chartDataList = React.useMemo(() => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return [];
    }

    if (isAnalytics) {
      // For Analytics API - audience insights data
      const users = rawData.map((d, i) => ({
        name: d.value || `Device ${i + 1}`,
        value: d.users || 0,
        color: colors[i % colors.length],
      }));

      const engagementRate = rawData.map((d, i) => ({
        name: d.value || `Device ${i + 1}`,
        value: Number((d.engagementRate || 0).toFixed(2)),
        color: colors[i % colors.length],
      }));

      return [
        { name: "Users", data: users },
        { name: "Engagement Rate", data: engagementRate },
      ];
    } else {
      return [];
    }
  }, [rawData, isAnalytics]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value } = payload[0].payload;
      const currentChart = chartDataList[currentIndex];
      if (currentChart && currentChart.data) {
        const total = currentChart.data.reduce((sum, item) => sum + item.value, 0);
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

        return (
          <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
            <p className="font-semibold">{name}</p>
            <p>Value: {value.toLocaleString()}</p>
            <p>Percentage: {percentage}%</p>
          </div>
        );
      }
    }
    return null;
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };
  const handleNext = () => {
    if (currentIndex < chartDataList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const currentEntity = isAnalytics ? activeProperty : activeCampaign;
  const entityType = isAnalytics ? "property" : "customer";

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300 h-full">
      <h3 className="font-semibold mb-4 text-gray-900">Device Performance</h3>

      {!currentEntity ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Please select a {entityType} to view device performance.
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading device performance...
        </div>
      ) : error || chartDataList.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No device performance data available.
        </div>
      ) : (
        <>
          {/* Dot Navigation */}
          {chartDataList.length > 1 && (
            <div className="flex justify-center mb-4">
              {chartDataList.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 mx-1 rounded-full transition-colors ${
                    index === currentIndex ? "bg-[#1A4752]" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            {/* Left Arrow */}
            <button onClick={handlePrev} className="p-2" disabled={currentIndex === 0}>
              <IoMdArrowDropleft
                size={40}
                color={currentIndex === 0 ? "#ccc" : "#1A4752"}
              />
            </button>

            {/* Chart container */}
            <div ref={containerRef} className="flex-1 max-w-sm aspect-square">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataList[currentIndex].data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="75%"
                    outerRadius="90%"
                    stroke="none"
                    onClick={(entry) =>
                      setActiveSlice(activeSlice === entry.name ? null : entry.name)
                    }
                  >
                    {chartDataList[currentIndex].data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="font-semibold text-gray-700"
                    fontSize={
                      chartDataList[currentIndex].name.length > 10
                        ? 12
                        : chartDataList[currentIndex].name.length > 5
                        ? 13
                        : 14
                    }
                  >
                    {chartDataList[currentIndex].name}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              className="p-2"
              disabled={currentIndex === chartDataList.length - 1}
            >
              <IoMdArrowDropright
                size={40}
                color={currentIndex === chartDataList.length - 1 ? "#ccc" : "#1A4752"}
              />
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center mt-2 text-xs">
            {chartDataList[currentIndex].data.map((item, index) => (
              <div
                key={index}
                className="flex items-center mr-3 mb-1 select-none cursor-pointer"
                onClick={() =>
                  setActiveSlice(activeSlice === item.name ? null : item.name)
                }
              >
                <div
                  className="w-3 h-3 mr-1"
                  style={{
                    backgroundColor: item.color,
                    opacity: !activeSlice || activeSlice === item.name ? 1 : 0.3,
                  }}
                />
                <span
                  style={{
                    color: !activeSlice || activeSlice === item.name ? "#000" : "#888",
                    textDecoration:
                      !activeSlice || activeSlice === item.name ? "none" : "line-through",
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default DevicePerformancePie;
