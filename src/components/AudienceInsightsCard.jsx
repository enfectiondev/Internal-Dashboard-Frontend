import React, { useState } from "react";
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
import { useApiWithCache } from "../hooks/useApiWithCache";

// Custom Tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, users } = payload[0].payload;
    return (
      <div className="bg-white p-2 shadow text-sm text-gray-800 border border-gray-200">
        <p className="font-semibold">{name}</p>
        {value !== undefined && <p>Percentage: {value} %</p>}
        {users !== undefined && <p>Users: {users.toLocaleString()}</p>}
      </div>
    );
  }
  return null;
};

export default function AudienceInsightsCard({ activeProperty, period, customDates }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);

  // Fetch Browser Usage
  const { data: browserData, loading: loadingBrowser } = useApiWithCache(
    activeProperty?.id,
    period,
    'audience-insights-browser',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      // Build URL with custom dates if needed
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/audience-insights/${propertyId}?dimension=browser&period=${analyticsPeriod}`;
      
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
      convertPeriod: true,
      customDates  // Pass customDates to the hook
    }
  );

  // Fetch Gender Split
  const { data: genderData, loading: loadingGender } = useApiWithCache(
    activeProperty?.id,
    period,
    'audience-insights-gender',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/audience-insights/${propertyId}?dimension=userGender&period=${analyticsPeriod}`;
      
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
      convertPeriod: true,
      customDates
    }
  );

  // Fetch Age Groups
  const { data: ageData, loading: loadingAge } = useApiWithCache(
    activeProperty?.id,
    period,
    'audience-insights-age',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/audience-insights/${propertyId}?dimension=userAgeBracket&period=${analyticsPeriod}`;
      
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
      convertPeriod: true,
      customDates
    }
  );

  // Process data into chart format
  const chartDataList = React.useMemo(() => {
    const charts = [];

    // Always add browser chart
    charts.push({
      name: "Browser Usage",
      displayName: "User by Browser Type",
      type: "bar",
      data: browserData && Array.isArray(browserData) ? browserData.map((d) => ({
        name: d.value || 'Unknown',
        value: Number(d.percentage?.toFixed(2) || 0),
        users: d.users || 0,
      })) : [
        { name: "Chrome", value: 45, users: 900 },
        { name: "Firefox", value: 30, users: 600 },
        { name: "Safari", value: 25, users: 500 }
      ]
    });

    // Always add gender chart
    charts.push({
      name: "Gender Split",
      displayName: "User by Gender Type",
      type: "pie",
      data: genderData && Array.isArray(genderData) ? genderData.map((d) => ({
        name: d.value,
        value: Number(d.percentage?.toFixed(2) || 0),
        users: d.users || 0,
        color:
          d.value === "male"
            ? "#1A4752"
            : d.value === "female"
            ? "#2B889C"
            : "#58C3DB",
      })) : [
        { name: "male", value: 60, users: 1200, color: "#1A4752" },
        { name: "female", value: 40, users: 800, color: "#2B889C" }
      ]
    });

    // Always add age chart
    charts.push({
      name: "Age Groups",
      displayName: "User by Age Range",
      type: "bar",
      barSize: 80, // Increase bar width for this chart
      data: ageData && Array.isArray(ageData) ? ageData.map((d) => ({
      name: d.value,
      value: Number(d.percentage?.toFixed(2) || 0),
      users: d.users || 0,
      })) : [
      { name: "18-24", value: 25, users: 500 },
      { name: "25-34", value: 45, users: 900 },
      { name: "35-44", value: 30, users: 600 }
      ]
    });

    console.log('Final charts:', charts);
    return charts;
  }, [browserData, genderData, ageData]);

  const currentChart = chartDataList[currentIndex];
  const isLoading = loadingBrowser || loadingGender || loadingAge;

  // Simple navigation functions
  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === 0 ? chartDataList.length - 1 : prev - 1;
      console.log('Going to previous:', newIndex);
      return newIndex;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev === chartDataList.length - 1 ? 0 : prev + 1;
      console.log('Going to next:', newIndex);
      return newIndex;
    });
  };

  const renderChart = () => {
    console.log('Rendering chart:', currentChart);
    
    if (isLoading) return <p className="text-center">Loading chart data...</p>;
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
        <div className="flex items-center justify-between h-full">
          {/* Pie Chart - Maximized */}
          <div className="flex-1 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentChart.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={70}
                  labelLine={false}
                  stroke="none"
                  onClick={(entry) =>
                    setActiveSlice(activeSlice === entry.name ? null : entry.name)
                  }
                >
                  {currentChart.data.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color || "#8884d8"}
                      opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />

                {/* Center labels */}
                <text
                  x="50%"
                  y="45%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-blue-400 text-xs font-medium"
                >
                  Majority
                </text>
                {majority && (
                  <text
                    x="50%"
                    y="55%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-black text-sm font-bold"
                  >
                    {majority.name}
                  </text>
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend for Pie Chart */}
          <div className="w-32 flex flex-col justify-center space-y-2 ml-4">
            {currentChart.data.map((item, index) => (
              <div
                key={index}
                className="flex items-center cursor-pointer"
                onClick={() =>
                  setActiveSlice(activeSlice === item.name ? null : item.name)
                }
              >
                <div
                  className="w-4 h-4 mr-2 rounded"
                  style={{
                    backgroundColor: item.color,
                    opacity: !activeSlice || activeSlice === item.name ? 1 : 0.3,
                  }}
                ></div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: !activeSlice || activeSlice === item.name ? "#000" : "#888",
                    textDecoration: !activeSlice || activeSlice === item.name ? "none" : "line-through",
                  }}
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const gradientId = `grad-${currentIndex}`;
      const isHorizontal = currentChart.name === "Browser Usage";
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout={isHorizontal ? "vertical" : "horizontal"}
            data={currentChart.data}
            barCategoryGap="20%"
            margin={{ top: 20, right: 50, left: isHorizontal ? 80 : 20, bottom: isHorizontal ? 20 : 50 }}
          >
            {isHorizontal ? (
              <>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={12}
                  tick={{ fontWeight: "bold", fill: "#000" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="name"
                  fontSize={12}
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
              barSize={isHorizontal ? 30 : 50}
            >
              {currentChart.data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={`url(#${gradientId})`}
                  opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                  stroke="none"
                />
              ))}
              {/* Data labels at the end of bars */}
              <LabelList
                dataKey="value"
                position={isHorizontal ? "right" : "top"}
                formatter={(val) => `${val}%`}
                fill="#1A4752"
                fontWeight="bold"
                fontSize={12}
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

  // Debug logs
  console.log('Current Index:', currentIndex);
  console.log('Chart Data List Length:', chartDataList.length);
  console.log('Current Chart:', currentChart);

  if (!activeProperty) {
    return (
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-sm h-full">
        <div className="flex justify-center items-center h-64 text-gray-500 font-medium">
          Please select a property to view audience insights.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 p-6 rounded-lg shadow-sm h-full">
      {/* Header with title */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold mb-2 text-gray-900">Audience Insights</h3>
        <span className="font-semibold text-black text-sm">
          {currentChart?.displayName || ""}
        </span>
      </div>
      <hr className="mb-4" />

      {/* Dot Navigation - Above the chart */}
      {chartDataList.length > 1 && (
        <div className="flex justify-center mb-4">
          {chartDataList.map((chart, index) => (
            <button
              key={index}
              onClick={() => {
                console.log('Dot clicked, going to index:', index);
                setCurrentIndex(index);
              }}
              className={`w-3 h-3 mx-1 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#1A4752]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        {/* Left Arrow */}
        <button 
          onClick={() => {
            console.log('Left arrow clicked, current index:', currentIndex);
            handlePrev();
          }}
          className="p-2"
        >
          <IoMdArrowDropleft size={40} color="#1A4752" />
        </button>

        <div className="w-[700px] h-[400px]">{renderChart()}</div>

        {/* Right Arrow */}
        <button 
          onClick={() => {
            console.log('Right arrow clicked, current index:', currentIndex);
            handleNext();
          }}
          className="p-2 rounded"
        >
          <IoMdArrowDropright size={40} color="#1A4752" />
        </button>
      </div>
    </div>
  );
}