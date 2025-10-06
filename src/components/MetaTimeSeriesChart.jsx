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

function MetaTimeSeriesChart({ selectedCampaigns, period, customDates, facebookToken }) {
  const [timeseriesData, setTimeseriesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['spend', 'impressions']);

  useEffect(() => {
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      setSelectedCampaignIds([selectedCampaigns[0].campaign_id]);
      fetchTimeSeriesData();
    }
  }, [selectedCampaigns]);

  const fetchTimeSeriesData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = facebookToken || (typeof window !== 'undefined' ? window.localStorage?.getItem('facebook_token') : null);
      
      if (!token) {
        throw new Error('No Facebook token available');
      }
      
      const campaignIds = selectedCampaigns.map(c => c.campaign_id).join(',');
      
      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/timeseries?campaign_ids=${campaignIds}`;
      
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
      } else {
        url += `&period=${period || '90d'}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch timeseries data: ${response.status}`);
      }

      const data = await response.json();
      setTimeseriesData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching timeseries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCampaign = (campaignId) => {
    setSelectedCampaignIds(prev => 
      prev.includes(campaignId) 
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
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

    timeseriesData.forEach(campaign => {
      if (!selectedCampaignIds.includes(campaign.campaign_id)) return;

      const campaignName = selectedCampaigns.find(c => c.campaign_id === campaign.campaign_id)?.campaign_name || campaign.campaign_id;

      campaign.timeseries.forEach(point => {
        if (!dateMap.has(point.date)) {
          dateMap.set(point.date, { date: point.date });
        }

        const dateEntry = dateMap.get(point.date);
        selectedMetrics.forEach(metric => {
          const key = `${campaignName}_${metric}`;
          dateEntry[key] = point[metric];
        });
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = processChartData();

  const getLineKey = (campaignName, metric) => `${campaignName}_${metric}`;

  const getLineColor = (index) => {
    const colors = ['#1A4752', '#508995', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];
    return colors[index % colors.length];
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Time Series</h3>

      {/* Campaign Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaigns</label>
        <div className="flex flex-wrap gap-2">
          {selectedCampaigns.map(campaign => (
            <button
              key={campaign.campaign_id}
              onClick={() => toggleCampaign(campaign.campaign_id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCampaignIds.includes(campaign.campaign_id)
                  ? 'bg-[#1A4752] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {campaign.campaign_name}
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
            {selectedCampaignIds.map((campaignId, campaignIndex) => {
              const campaign = selectedCampaigns.find(c => c.campaign_id === campaignId);
              return selectedMetrics.map((metric, metricIndex) => (
                <Line
                  key={getLineKey(campaign.campaign_name, metric)}
                  type="monotone"
                  dataKey={getLineKey(campaign.campaign_name, metric)}
                  stroke={getLineColor(campaignIndex * selectedMetrics.length + metricIndex)}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name={`${campaign.campaign_name} - ${METRIC_OPTIONS.find(m => m.value === metric)?.label}`}
                />
              ));
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No data available for the selected campaigns and period.</p>
        </div>
      )}
    </div>
  );
}

export default MetaTimeSeriesChart;