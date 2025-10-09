import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function FacebookEngagementChart({ posts, isLoading }) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Over Time</h3>
                <div className="h-[300px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#196473] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (!posts || posts.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Over Time</h3>
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p>No data available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare chart data - sort by date and format
    const chartData = posts
        .map(post => ({
            date: new Date(post.created_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: new Date(post.created_time),
            reactions: post.reactions || 0,
            comments: post.comments || 0,
            shares: post.shares || 0,
            total: post.total_engagement || 0,
            impressions: post.impressions || 0,
            reach: post.reach || 0
        }))
        .sort((a, b) => a.fullDate - b.fullDate);

    const colorMap = {
        reactions: "#196473",
        comments: "#58c3db",
        shares: "#05242a"
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.date}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: colorMap[entry.dataKey] || "#777" }}>
                            {entry.name}: {entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Engagement Over Time</h3>
                <div className="text-sm text-gray-600">
                    {posts.length} posts
                </div>
            </div>
            
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: "#777" }}
                            stroke="#777"
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fill: "#777" }}
                            stroke="#777"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ fontSize: '12px', color: "#777" }}
                            iconType="line"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="reactions" 
                            stroke="#196473" 
                            strokeWidth={2}
                            dot={{ r: 4, stroke: "#196473", fill: "#196473" }}
                            name="Reactions"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="comments" 
                            stroke="#58c3db" 
                            strokeWidth={2}
                            dot={{ r: 4, stroke: "#58c3db", fill: "#58c3db" }}
                            name="Comments"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="shares" 
                            stroke="#05242a" 
                            strokeWidth={2}
                            dot={{ r: 4, stroke: "#05242a", fill: "#05242a" }}
                            name="Shares"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: "#196473" }}>
                        {chartData.reduce((sum, item) => sum + item.reactions, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Total Reactions</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: "#58c3db" }}>
                        {chartData.reduce((sum, item) => sum + item.comments, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Total Comments</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: "#05242a" }}>
                        {chartData.reduce((sum, item) => sum + item.shares, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Total Shares</div>
                </div>
            </div>
        </div>
    );
}

export default FacebookEngagementChart;