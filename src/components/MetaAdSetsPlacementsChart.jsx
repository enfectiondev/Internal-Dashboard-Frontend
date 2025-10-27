import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function MetaAdSetsPlacementsChart({ selectedAdSets, period, customDates, facebookToken, currency = "MYR" }) {
  const [placementsData, setPlacementsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('spend');
  const [viewType, setViewType] = useState('bar'); // 'bar' or 'pie'

  // Map frontend period values to backend expected values
  const mapPeriodToBackend = (frontendPeriod) => {
    const periodMap = {
      'LAST_7_DAYS': '7d',
      'LAST_30_DAYS': '30d',
      'LAST_90_DAYS': '90d',
      'LAST_365_DAYS': '365d'
    };
    return periodMap[frontendPeriod] || '90d';
  };

  useEffect(() => {
    if (selectedAdSets && selectedAdSets.length > 0) {
      fetchPlacementsData();
    }
  }, [selectedAdSets, period, customDates]);

  const fetchPlacementsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }
      
      const adsetIds = selectedAdSets.map(a => a.id);
      
      let url = `${process.env.REACT_APP_API_BASE_URL}/api/meta/adsets/placements`;
      
      // Build query params for date filters
      const params = new URLSearchParams();
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        params.append('start_date', customDates.startDate);
        params.append('end_date', customDates.endDate);
      } else {
        params.append('period', mapPeriodToBackend(period));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adsetIds)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch placements data: ${response.status}`);
      }

      const data = await response.json();
      setPlacementsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ad sets placements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processBarChartData = () => {
    if (!placementsData || placementsData.length === 0) return [];

    const platformMap = new Map();

    placementsData.forEach(adset => {
      const adsetObj = selectedAdSets.find(a => a.id === adset.adset_id);
      const adsetName = adsetObj?.name || adset.adset_id;

      adset.placements.forEach(placement => {
        const key = placement.platform;
        
        if (!platformMap.has(key)) {
          platformMap.set(key, {
            platform: key.charAt(0).toUpperCase() + key.slice(1)
          });
        }

        const entry = platformMap.get(key);
        entry[adsetName] = placement[selectedMetric];
      });
    });

    return Array.from(platformMap.values());
  };

  const processPieChartData = () => {
    if (!placementsData || placementsData.length === 0) return [];

    const platformTotals = {};

    placementsData.forEach(adset => {
      adset.placements.forEach(placement => {
        const platform = placement.platform.charAt(0).toUpperCase() + placement.platform.slice(1);
        
        if (!platformTotals[platform]) {
          platformTotals[platform] = 0;
        }
        platformTotals[platform] += placement[selectedMetric];
      });
    });

    return Object.entries(platformTotals).map(([name, value]) => ({
      name,
      value
    }));
  };

  const barChartData = processBarChartData();
  const pieChartData = processPieChartData();

  const COLORS = ['#1A4752', '#508995', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444'];

  const getBarColor = (index) => {
    return COLORS[index % COLORS.length];
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].payload.platform || payload[0].name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-700">
              <span style={{ color: entry.color }}>{entry.name}: </span>
              {selectedMetric === 'spend' 
                ? `${currency} ${Number(entry.value).toFixed(2)}`
                : Number(entry.value).toLocaleString()
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading placements data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ad Set Platform Placements</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewType('bar')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === 'bar'
                ? 'bg-[#1A4752] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewType('pie')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewType === 'pie'
                ? 'bg-[#1A4752] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
        <div className="flex flex-wrap gap-2">
          {['spend', 'impressions', 'reach'].map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                selectedMetric === metric
                  ? 'bg-[#508995] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {viewType === 'bar' ? (
        barChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="platform" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              {selectedAdSets.map((adset, index) => (
                <Bar
                  key={adset.id}
                  dataKey={adset.name}
                  fill={getBarColor(index)}
                  name={adset.name}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No placements data available for the selected ad sets.</p>
          </div>
        )
      ) : (
        pieChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No placements data available for the selected ad sets.</p>
          </div>
        )
      )}
    </div>
  );
}

export default MetaAdSetsPlacementsChart;