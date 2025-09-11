import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, users } = payload[0].payload;
    return (
      <div className="bg-white p-2 shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{name}</p>
        {value !== undefined && <p>Percentage/Value: {value}</p>}
        {users !== undefined && <p>Users: {users.toLocaleString()}</p>}
      </div>
    );
  }
  return null;
};

export default function AudienceInsightsCard() {
  const [chartDataList, setChartDataList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1️⃣ Browser Usage
        const resBrowser = await fetch(
          "http://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/time-series/453831024?metric=totalRevenue&period=7d",
          { headers }
        );
        const rawBrowser = await resBrowser.json();
        const dataBrowser = Array.isArray(rawBrowser)
          ? rawBrowser
          : rawBrowser.data || [];
        const transformedBrowser = dataBrowser.map((d) => ({
          name: `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}`,
          value: Number(d.value.toFixed(2)),
          users: Math.round(d.value),
        }));

        // 2️⃣ Gender Split
        const resGender = await fetch(
          "http://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/audience-insights/417333460?dimension=userGender&period=30d",
          { headers }
        );
        const rawGender = await resGender.json();
        const dataGender = Array.isArray(rawGender) ? rawGender : rawGender.data || [];
        const transformedGender = dataGender.map((d) => ({
          name: d.value,
          value: Number(d.percentage.toFixed(2)),
          users: d.users,
          color:
            d.value === "male"
              ? "#1A4752"
              : d.value === "female"
              ? "#2B889C"
              : "#58C3DB",
        }));

        // 3️⃣ Age Groups
        const resAge = await fetch(
          "http://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/audience-insights/417333460?dimension=userAgeBracket&period=7d",
          { headers }
        );
        const rawAge = await resAge.json();
        const dataAge = Array.isArray(rawAge) ? rawAge : rawAge.data || [];
        const transformedAge = dataAge.map((d) => ({
          name: d.value,
          value: Number(d.percentage.toFixed(2)),
          users: d.users,
        }));

        // Set chart data
        setChartDataList([
          {
            name: "Browser Usage",
            displayName: "User by Browser Type",
            type: "bar",
            data: transformedBrowser,
          },
          {
            name: "Gender Split",
            displayName: "User by Gender Type",
            type: "pie",
            data: transformedGender,
          },
          {
            name: "Age Groups",
            displayName: "User by Age Range",
            type: "bar",
            data: transformedAge,
          },
        ]);
      } catch (err) {
        console.error("Failed to fetch audience insights:", err);
        setChartDataList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentChart = chartDataList[currentIndex];

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? chartDataList.length - 1 : prev - 1));
  const handleNext = () =>
    setCurrentIndex((prev) => (prev === chartDataList.length - 1 ? 0 : prev + 1));

  const renderChart = () => {
    if (loading) return <p className="text-center">Loading chart data...</p>;
    if (!currentChart || !currentChart.data || currentChart.data.length === 0)
      return <p className="text-center">No data available.</p>;

    if (currentChart.type === "pie") {
      // Get majority slice for center label
      const majority =
        currentChart.data.length > 0
          ? currentChart.data.reduce((max, item) =>
              item.value > max.value ? item : max
            )
          : null;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={currentChart.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={60}
              labelLine={false}
              onClick={(entry) =>
                setActiveSlice(activeSlice === entry.name ? null : entry.name)
              }
            >
              {currentChart.data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.color || "#8884d8"}
                  opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />

            {/* Center label */}
            {majority && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-center"
              >
                <tspan className="fill-black text-sm font-bold" x="50%" dy="0">
                  {majority.name}
                </tspan>
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      const gradientId = "grad-tw";
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout={currentChart.name === "Browser Usage" ? "vertical" : "horizontal"}
            data={currentChart.data}
            barCategoryGap="40%"
            margin={{ top: 40, right: 40, left: 60, bottom: 40 }}
          >
            {currentChart.name === "Browser Usage" ? (
              <>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={14}
                  tick={{ fontWeight: "bold", fill: "#000" }}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  fontSize={14}
                  tick={{ fontWeight: "bold", fill: "#000" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              barSize={currentChart.name === "Age Groups" ? 70 : 40}
            >
              {currentChart.data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`url(#${gradientId})`}
                  opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                />
              ))}
              <LabelList
                dataKey="value"
                position="center"
                formatter={(val) => `${val}%`}
                fill="#fff"
                fontWeight="bold"
              />
            </Bar>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#58C3DB" />
                <stop offset="100%" stopColor="#1A4752" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="bg-white text-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold mb-2 text-gray-900">Audience Insights</h3>
        <span className="font-semibold text-black text-sm">
          {currentChart?.displayName || ""}
        </span>
      </div>
      <hr className="mb-4" />
      <div className="flex justify-between items-center">
        <button onClick={handlePrev} className="p-2">
          <IoMdArrowDropleft size={40} color="#1A4752" />
        </button>
        <div className="w-[700px] h-[400px]">{renderChart()}</div>
        <button onClick={handleNext} className="p-2 rounded">
          <IoMdArrowDropright size={40} color="#1A4752" />
        </button>
      </div>
    </div>
  );
}
