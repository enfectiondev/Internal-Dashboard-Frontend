import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function MetaDemographicsChart({ selectedCampaigns, period, customDates, facebookToken, currency = "MYR" }) {
  const [demographicsData, setDemographicsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('spend');

  useEffect(() => {
    if (selectedCampaigns && selectedCampaigns.length > 0) {
      fetchDemographicsData();
    }
  }, [selectedCampaigns]);

  const fetchDemographicsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = facebookToken || localStorage.getItem('facebook_token');
      
      if (!token) {
        throw new Error('No Facebook token available');
      }
      
      const campaignIds = selectedCampaigns.map(c => c.campaign_id);
      
      let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/campaigns/demographics`;
      
      // Build query params for date filters
      const params = new URLSearchParams();
      if (period === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
        params.append('start_date', customDates.startDate);
        params.append('end_date', customDates.endDate);
      } else {
        params.append('period', period || '90d');
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
        body: JSON.stringify(campaignIds)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch demographics data: ${response.status}`);
      }

      const data = await response.json();
      setDemographicsData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching demographics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = () => {
    if (!demographicsData || demographicsData.length === 0) return [];

    const ageGenderMap = new Map();

    demographicsData.forEach(campaign => {
      const campaignName = selectedCampaigns.find(c => c.campaign_id === campaign.campaign_id)?.campaign_name || campaign.campaign_id;

      campaign.demographics.forEach(demo => {
        const key = `${demo.age}_${demo.gender}`;
        
        if (!ageGenderMap.has(key)) {
          ageGenderMap.set(key, {
            category: `${demo.age} (${demo.gender})`,
            age: demo.age,
            gender: demo.gender
          });
        }

        const entry = ageGenderMap.get(key);
        entry[campaignName] = demo[selectedMetric];
      });
    });

    return Array.from(ageGenderMap.values()).sort((a, b) => {
      const ageOrder = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
      const ageComparison = ageOrder.indexOf(a.age) - ageOrder.indexOf(b.age);
      if (ageComparison !== 0) return ageComparison;
      return a.gender.localeCompare(b.gender);
    });
  };

  const chartData = processChartData();

  const getBarColor = (index) => {
    const colors = ['#1A4752', '#508995', '#22C55E', '#F59E0B', '#8B5CF6', '#EF4444'];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 flex items-center justify-center h-96">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#1A4752] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading demographics data...</span>
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
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Demographics Breakdown</h3>

      {/* Metric Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
        <div className="flex flex-wrap gap-2">
          {['spend', 'impressions', 'reach', 'results'].map(metric => (
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
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="category" 
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={100}
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
              formatter={(value) => {
                if (selectedMetric === 'spend') {
                  return `${currency} ${Number(value).toFixed(2)}`;
                }
                return Number(value).toLocaleString();
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            {selectedCampaigns.map((campaign, index) => (
              <Bar
                key={campaign.campaign_id}
                dataKey={campaign.campaign_name}
                fill={getBarColor(index)}
                name={campaign.campaign_name}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No demographics data available for the selected campaigns.</p>
        </div>
      )}
    </div>
  );
}

export default MetaDemographicsChart;