import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { IoMdArrowDropleft, IoMdArrowDropright } from "react-icons/io";
import { useApiWithCache } from "../hooks/useApiWithCache";

const colors = ["#1A4752", "#508995", "#9AB4BA", "#B5B5B5"];

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

function DevicePieChart({ activeCampaign, period, customDates }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSlice, setActiveSlice] = useState(null);

  const convertPeriodForAPI = (period) => {
    const periodMap = {
      'LAST_7_DAYS': 'LAST_7_DAYS',
      'LAST_30_DAYS': 'LAST_30_DAYS',
      'LAST_3_MONTHS': 'LAST_90_DAYS',
      'LAST_1_YEAR': 'LAST_365_DAYS',
      'CUSTOM': 'CUSTOM'
    };
    return periodMap[period] || period;
  };

  const deviceApiCall = async (customerId, period, customDates) => {
    const token = localStorage.getItem("token");
    const convertedPeriod = convertPeriodForAPI(period);

    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/device-performance/${customerId}?period=${convertedPeriod}`;
    
    if (convertedPeriod === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }

    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const devices = await res.json();

    if (!Array.isArray(devices) || devices.length === 0) return [];

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

    return [
      { name: "Clicks", data: clicks },
      { name: "Impressions", data: impressions },
      { name: "Cost", data: cost },
    ];
  };

  const { data: chartDataList, loading, error } = useApiWithCache(
    activeCampaign?.id,
    period,
    'device-performance',
    deviceApiCall,
    { customDates }
  );

  // Calculate majority device and its percentage
  const getMajorityDevice = () => {
    const currentData = chartDataList?.[currentIndex]?.data || [];
    if (currentData.length === 0) return { name: '', value: 0, percentage: 0 };
    
    const total = currentData.reduce((sum, item) => sum + item.value, 0);
    const maxItem = currentData.reduce((max, item) => 
      item.value > max.value ? item : max
    , { value: 0, name: '' });
    
    const percentage = total > 0 ? ((maxItem.value / total) * 100).toFixed(1) : 0;
    
    return {
      name: maxItem.name,
      value: maxItem.value,
      percentage: percentage
    };
  };

  const handlePrev = () =>
    setCurrentIndex((prev) =>
      prev === 0 ? (chartDataList?.length || 1) - 1 : prev - 1
    );
  const handleNext = () =>
    setCurrentIndex((prev) =>
      prev === (chartDataList?.length || 1) - 1 ? 0 : prev + 1
    );

  // Custom label component that shows majority device and percentage
  const renderCenterLabel = ({ cx, cy }) => {
    const majority = getMajorityDevice();
    
    // Split name into words for wrapping
    const words = majority.name.split(' ');
    const lines = [];
    let currentLine = '';
    const maxCharsPerLine = 10;
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // If still too long, truncate
    const finalLines = lines.map(line => 
      line.length > maxCharsPerLine ? line.substring(0, maxCharsPerLine - 2) + '..' : line
    );
    
    // Calculate vertical spacing based on number of lines
    const nameHeight = finalLines.length * 14;
    const startY = cy - (nameHeight / 2) - 5;
    
    return (
      <g>
        {/* Device Name */}
        {finalLines.map((line, index) => (
          <text
            key={`name-${index}`}
            x={cx}
            y={startY + (index * 14)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-bold"
            fontSize={13}
            fill="#1A4752"
          >
            {line}
          </text>
        ))}
        
        {/* Percentage */}
        <text
          x={cx}
          y={cy + (nameHeight / 2) + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-semibold"
          fontSize={16}
          fill="#508995"
        >
          {majority.percentage}%
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm border border-gray-300">
      <h3 className="font-semibold mb-4 text-[#1A4752]">Device Performance</h3>
      <hr className="mb-4 border-[#B5B5B5]" />

      {(loading && !chartDataList) ? (
        <div className="flex justify-center items-center h-64 text-[#508995] font-medium">
          Loading device performance...
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64 text-[#B5B5B5] font-medium">
          Error loading device data: {error.message}
        </div>
      ) : !chartDataList?.length ? (
        <div className="flex justify-center items-center h-64 text-[#B5B5B5] font-medium">
          No device performance data available.
        </div>
      ) : (
        <>
          {(() => {
            const totalSections = chartDataList?.length || 0;
            const maxIndex = totalSections - 1;
            
            return (
              <>
                {/* Page Indicators - Above pie chart */}
                {totalSections > 1 && (
                  <div className="flex justify-center mb-4 space-x-2">
                    {Array.from({ length: totalSections }, (_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          index === currentIndex 
                            ? 'bg-[#1A4752] scale-125' 
                            : 'bg-[#B5B5B5] hover:bg-[#9AB4BA]'
                        }`}
                        onClick={() => setCurrentIndex(index)}
                        title={chartDataList[index]?.name || `Chart ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  {/* Left Arrow - Only show if there are multiple sections and not at first item */}
                  <div className="w-12 flex justify-center">
                    {totalSections > 1 && currentIndex > 0 ? (
                      <button 
                        onClick={handlePrev} 
                        className="p-2 transition-all duration-300 opacity-100 hover:scale-110"
                        title="Previous chart"
                      >
                        <IoMdArrowDropleft size={50} color="#1A4752" />
                      </button>
                    ) : (
                      <div className="w-12"></div>
                    )}
                  </div>

                  <div className="w-80 h-64 transition-all duration-500 ease-in-out">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataList[currentIndex]?.data || []}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={({ name }) =>
                            activeSlice === name ? 93 : 85
                          }
                          labelLine={false}
                          label={renderCenterLabel}
                          onClick={(entry) =>
                            setActiveSlice(activeSlice === entry.name ? null : entry.name)
                          }
                          animationBegin={0}
                          animationDuration={400}
                        >
                          {(chartDataList[currentIndex]?.data || []).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              opacity={
                                !activeSlice || activeSlice === entry.name ? 1 : 0.3
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right Arrow - Only show if there are multiple sections and not at last item */}
                  <div className="w-12 flex justify-center">
                    {totalSections > 1 && currentIndex < maxIndex ? (
                      <button 
                        onClick={handleNext} 
                        className="p-2 transition-all duration-300 opacity-100 hover:scale-110"
                        title="Next chart"
                      >
                        <IoMdArrowDropright size={50} color="#1A4752" />
                      </button>
                    ) : (
                      <div className="w-12"></div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}

          {/* Clickable Legend */}
          <div className="flex flex-wrap justify-center mt-2 text-xs">
            {(chartDataList[currentIndex]?.data || []).map((item, index) => (
              <div
                key={index}
                className="flex items-center mr-3 mb-1 select-none cursor-pointer"
                onClick={() =>
                  setActiveSlice(activeSlice === item.name ? null : item.name)
                }
              >
                <div
                  className="w-3 h-3 mr-1 rounded-sm"
                  style={{
                    backgroundColor: item.color,
                    opacity:
                      !activeSlice || activeSlice === item.name ? 1 : 0.3,
                  }}
                ></div>
                <span
                  style={{
                    color: !activeSlice || activeSlice === item.name ? "#000" : "#888",
                    textDecoration:
                      !activeSlice || activeSlice === item.name
                        ? "none"
                        : "line-through",
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

export default DevicePieChart;