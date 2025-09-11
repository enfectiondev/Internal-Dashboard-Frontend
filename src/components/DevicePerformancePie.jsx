import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";

const colors = ["#1A4752", "#2B889C", "#A0C6CE", "#58C3DB"];

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

function DevicePerformancePie() {
  const [chartDataList, setChartDataList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/device-performance/3220426249?period=LAST_7_DAYS",
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

        const devices = await res.json();
        if (!Array.isArray(devices) || devices.length === 0) {
          setChartDataList([]);
          return;
        }

        const clicks = devices.map((d, i) => ({
          name: d.device_info?.label || `Device ${i + 1}`,
          value: d.clicks,
          color: colors[i % colors.length],
        }));

        const impressions = devices.map((d, i) => ({
          name: d.device_info?.label || `Device ${i + 1}`,
          value: d.impressions,
          color: colors[i % colors.length],
        }));

        const cost = devices.map((d, i) => ({
          name: d.device_info?.label || `Device ${i + 1}`,
          value: Number(d.cost?.toFixed(2) || 0),
          color: colors[i % colors.length],
        }));

        setChartDataList([
          { name: "Clicks", data: clicks },
          { name: "Impressions", data: impressions },
          { name: "Cost", data: cost },
        ]);
      } catch (err) {
        console.error("Failed to fetch device performance:", err);
        setChartDataList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? chartDataList.length - 1 : prev - 1
    );
  const handleNext = () =>
    setCurrentIndex((prev) =>
      prev === chartDataList.length - 1 ? 0 : prev + 1
    );

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300">
      <h3 className="font-semibold mb-4 text-gray-900">Device Performance</h3>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Loading device performance...
        </div>
      ) : chartDataList.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          No device performance data available.
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <button onClick={handlePrev} className="p-2">
              <IoMdArrowDropleft size={50} color="#1A4752" />
            </button>

            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataList[currentIndex].data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    label={({ cx, cy }) => (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="font-semibold text-gray-700"
                      >
                        {chartDataList[currentIndex].name}
                      </text>
                    )}
                    onClick={(entry) =>
                      setActiveSlice(activeSlice === entry.name ? null : entry.name)
                    }
                  >
                    {chartDataList[currentIndex].data.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.color}
                        opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <button onClick={handleNext} className="p-2">
              <IoMdArrowDropright size={50} color="#1A4752" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center mt-2 text-xs">
            {chartDataList[currentIndex].data.map((item, index) => (
              <div
                key={index}
                className="flex items-center mr-3 mb-1 select-none"
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
