import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const METRIC_OPTIONS = [
  { value: 'spend', label: 'Spend', color: '#1A4752' },
  { value: 'impressions', label: 'Impressions', color: '#508995' },
  { value: 'clicks', label: 'Clicks', color: '#22C55E' },
  { value: 'conversions', label: 'Conversions', color: '#F59E0B' },
  { value: 'reach', label: 'Reach', color: '#8B5CF6' },
  { value: 'ctr', label: 'CTR (%)', color: '#EF4444' },
  { value: 'cpc', label: 'CPC', color: '#EC4899' },
  { value: 'cpm', label: 'CPM', color: '#06B6D4' }
];

function MetaAdSetsTimeSeriesChart({ selectedAdSets, period, customDates, facebookToken }) {
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAdSetIds, setSelectedAdSetIds] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['spend', 'impressions']);

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
      // Reset to first ad set and fetch new data
      setSelectedAdSetIds([selectedAdSets[0].id]);
      fetchTimeSeriesData();
    }
  }, [selectedAdSets, period, customDates]);

  const fetchTimeSeriesData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }
      
      const adsetIds = selectedAdSets.map(a => a.id);
      
      let url = `${process.env.REACT_APP_API_BASE_URL}/api/meta/adsets/timeseries`;
      
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
        throw new Error(`Failed to fetch timeseries data: ${response.status}`);
      }

      const data = await response.json();
      setTimeseriesData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching ad sets timeseries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdSet = (adsetId) => {
    setSelectedAdSetIds(prev => 
      prev.includes(adsetId) 
        ? prev.filter(id => id !== adsetId)
        : [...prev, adsetId]
    );
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const processChartData = () => {
    if (!timeseriesData || timeseriesData.length === 0) return [];

    const dateMap = new Map();

    timeseriesData.forEach(adset => {
      if (!selectedAdSetIds.includes(adset.adset_id)) return;

      // Find ad set name, with fallback to adset_id if not found
      const adsetObj = selectedAdSets.find(a => a.id === adset.adset_id);
      const adsetName = adsetObj?.name || adset.adset_id;

      adset.timeseries.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }

        const dateEntry = dateMap.get(point.date);
        selectedMetrics.forEach(metric => {
          const key = `${adsetName}_${metric}`;
          dateEntry[key] = point[metric];
        });
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = processChartData();

  const getLineKey = (adsetName, metric) => `${adsetName}_${metric}`;

  const getLineColor = (index) => {
    const colors = ['#1A4752', '#508995', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];
    return colors[index % colors.length];
  };

  // Get valid lines to render - only render lines for ad sets that exist in selectedAdSets
  const getValidLines = () => {
    const lines = [];
    selectedAdSetIds.forEach((adsetId, adsetIndex) => {
      const adset = selectedAdSets.find(a => a.id === adsetId);
      if (!adset) return; // Skip if ad set not found
      
      selectedMetrics.forEach((metric, metricIndex) => {
        const metricOption = METRIC_OPTIONS.find(m => m.value === metric);
        if (!metricOption) return; // Skip if metric not found
        
        lines.push({
          key: getLineKey(adset.name, metric),
          dataKey: getLineKey(adset.name, metric),
          stroke: getLineColor(adsetIndex * selectedMetrics.length + metricIndex),
          name: `${adset.name} - ${metricOption.label}`
        });
      });
    });
    return lines;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading time series data...</span>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Set Time Series</h3>

      {/* Ad Set Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Ad Sets</label>
        <div className="flex flex-wrap gap-2">
          {selectedAdSets.map(adset => (
            <button
              key={adset.id}
              onClick={() => toggleAdSet(adset.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedAdSetIds.includes(adset.id)
                  ? 'bg-[#1A4752] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {adset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Metrics</label>
        <div className="flex flex-wrap gap-2">
          {METRIC_OPTIONS.map(metric => (
            <button
              key={metric.value}
              onClick={() => toggleMetric(metric.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedMetrics.includes(metric.value)
                  ? 'bg-[#508995] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#FFF', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            {getValidLines().map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.stroke}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={line.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No data available for the selected ad sets and period.</p>
        </div>
      )}
    </div>
  );
}

export default MetaAdSetsTimeSeriesChart;