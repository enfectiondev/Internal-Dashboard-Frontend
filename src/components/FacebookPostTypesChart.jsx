import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#1A4752", "#508995", "#9AB4BA", "#B5B5B5"];

function FacebookPostTypesChart({ posts, isLoading }) {
  const [activeSlice, setActiveSlice] = useState(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#B5B5B5]">
        <h3 className="text-lg font-semibold text-[#1A4752] mb-4">Post Types Distribution</h3>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#508995] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-[#B5B5B5]">
        <h3 className="text-lg font-semibold text-[#1A4752] mb-4">Post Types Distribution</h3>
        <div className="h-[300px] flex items-center justify-center text-[#9AB4BA]">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-[#B5B5B5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <p>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate post types
  const typeCount = {};
  const typeEngagement = {};
  
  posts.forEach(post => {
    const type = post.type || 'status';
    typeCount[type] = (typeCount[type] || 0) + 1;
    typeEngagement[type] = (typeEngagement[type] || 0) + (post.total_engagement || 0);
  });

  const chartData = Object.keys(typeCount).map((type, index) => ({
    name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: typeCount[type],
    engagement: typeEngagement[type],
    percentage: ((typeCount[type] / posts.length) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }));

  // Calculate majority post type
  const getMajorityType = () => {
    if (chartData.length === 0) return { name: '', value: 0, percentage: 0 };
    
    const maxItem = chartData.reduce((max, item) => 
      item.value > max.value ? item : max
    , { value: 0, name: '', percentage: 0 });
    
    return maxItem;
  };

  const majorityType = getMajorityType();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-[#B5B5B5] rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-[#1A4752] mb-1">{data.name}</p>
          <p className="text-sm text-gray-700">Posts: {data.value}</p>
          <p className="text-sm text-gray-700">Engagement: {data.engagement.toLocaleString()}</p>
          <p className="text-sm text-[#508995] font-semibold">Share: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom center label showing majority
  const renderCenterLabel = ({ cx, cy }) => {
    const words = majorityType.name.split(' ');
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
    
    const finalLines = lines.map(line => 
      line.length > maxCharsPerLine ? line.substring(0, maxCharsPerLine - 2) + '..' : line
    );
    
    const nameHeight = finalLines.length * 14;
    const startY = cy - (nameHeight / 2) - 5;
    
    return (
      <g>
        {/* Post Type Name */}
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
          {majorityType.percentage}%
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#B5B5B5]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#1A4752]">Post Types Distribution</h3>
        <div className="text-sm text-[#508995] font-medium">
          {posts.length} total posts
        </div>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={({ name }) => activeSlice === name ? 93 : 85}
              labelLine={false}
              label={renderCenterLabel}
              dataKey="value"
              onClick={(entry) => setActiveSlice(activeSlice === entry.name ? null : entry.name)}
              animationBegin={0}
              animationDuration={400}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  opacity={!activeSlice || activeSlice === entry.name ? 1 : 0.3}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Clickable Legend */}
      <div className="flex flex-wrap justify-center mt-4 gap-3">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center cursor-pointer select-none"
            onClick={() => setActiveSlice(activeSlice === item.name ? null : item.name)}
          >
            <div 
              className="w-3 h-3 rounded-sm mr-1.5" 
              style={{ 
                backgroundColor: item.color,
                opacity: !activeSlice || activeSlice === item.name ? 1 : 0.3
              }}
            />
            <span 
              className="text-xs"
              style={{
                color: !activeSlice || activeSlice === item.name ? "#000" : "#888",
                textDecoration: !activeSlice || activeSlice === item.name ? "none" : "line-through"
              }}
            >
              {item.name}
            </span>
          </div>
        ))}
      </div>

      {/* Type Breakdown */}
      <div className="mt-4 pt-4 border-t border-[#B5B5B5] space-y-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[#1A4752] font-medium">{item.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-[#508995]">{item.value} posts</span>
              <span className="text-[#1A4752] font-semibold">{item.engagement.toLocaleString()} eng.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FacebookPostTypesChart;