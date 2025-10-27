import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AiOutlineCaretDown } from "react-icons/ai";
import { ArrowLeft } from "lucide-react";
import { useCache } from "../context/CacheContext";


// Inner ROIAnalytics Component that handles the actual charts and data
const ROIAnalyticsInner = ({ propertyId, adsCustomerId, onBack, period, customDates }) => {
  // ✅ ADD THESE LOGS AT THE VERY TOP
  console.log('[ROIAnalyticsInner] Props received:', { propertyId, adsCustomerId, period, customDates });
  
  const [chartData, setChartData] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChannels, setShowChannels] = useState({
    Direct: true,
    Unassigned: true,
    'Organic Search': true,
    'Organic Social': true,
    'Paid Search': true,
    'Paid Social': true,
    totalRevenue: true,
  });

  const token = localStorage.getItem("token");
  // const { getFromCache, setCache } = useCache();
  const { getRawCacheData, setCache } = useCache();

  // Channel colors
  const channelColors = {
    Direct: "#1f77b4",
    Unassigned: "#ff7f0e",
    'Organic Search': "#2ca02c",
    'Organic Social': "#d62728",
    'Paid Search': "#9467bd",
    'Paid Social': "#8c564b",
    totalRevenue: "#374151",
  };


  // Convert period format for API
  const convertPeriodForAPI = (period) => {
    console.log('[convertPeriodForAPI] Input period:', period);
    
    // ✅ FIXED: Handle both formats - ads format (LAST_X_DAYS) and GA4 format (Xd)
    const periodMap = {
      // Ads format
      'LAST_7_DAYS': '7d',
      'LAST_30_DAYS': '30d',
      'LAST_3_MONTHS': '90d',
      'LAST_1_YEAR': '365d',
      'CUSTOM': 'custom',
      // GA4 format (already converted) - just return as-is
      '7d': '7d',
      '30d': '30d',
      '90d': '90d',
      '365d': '365d',
      'custom': 'custom'
    };
    
    const result = periodMap[period] || '7d';
    console.log('[convertPeriodForAPI] Output period:', result);
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      const timeframe = convertPeriodForAPI(period);
      
      // ✅ NEW: Create a unique cache key that includes actual dates for custom periods
      let cacheKey;
      if (timeframe === 'custom' && customDates?.startDate && customDates?.endDate) {
        // For custom periods, use the actual date range in the key
        cacheKey = `roi_${propertyId}_${adsCustomerId}_custom_${customDates.startDate}_${customDates.endDate}`;
      } else {
        // For predefined periods, use the period name
        cacheKey = `roi_${propertyId}_${adsCustomerId}_${timeframe}`;
      }
      
      console.log('[ROI Analytics] Cache key:', cacheKey);
      
      // ✅ Check cache using the raw cache key (not going through complex logic)
      const cachedData = getRawCacheData(cacheKey);
      if (cachedData) {
        console.log('[ROI Analytics] Using cached data:', cachedData);
        setChartData(cachedData.chartData || []);
        setMatrixData(cachedData.matrixData || null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('[ROI Analytics] Fetching fresh data...');
        
        // Build URLs with custom dates if needed
        let channelUrl = `${process.env.REACT_APP_API_BASE_URL}/api/analytics/channel-revenue-timeseries/${propertyId}?period=${timeframe}`;
        let revenueUrl = `${process.env.REACT_APP_API_BASE_URL}/api/analytics/time-series/${propertyId}?metric=totalRevenue&period=${timeframe}`;
        let matrixUrl = `${process.env.REACT_APP_API_BASE_URL}/api/combined/roas-roi-metrics?ga_property_id=${propertyId}&ads_customer_ids=${adsCustomerId}&period=${timeframe}`;
        
        // Add custom date parameters for GA4 endpoints (lowercase 'custom')
        if (timeframe === 'custom' && customDates?.startDate && customDates?.endDate) {
          const dateParams = `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
          channelUrl += dateParams;
          revenueUrl += dateParams;
          matrixUrl += dateParams;
        }
        
        // Fetch channel revenue timeseries
        const channelRes = await fetch(channelUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const channelData = await channelRes.json();

        // Fetch total revenue timeseries
        const revenueRes = await fetch(revenueUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const revenueData = await revenueRes.json();

        // Fetch ROAS/ROI metrics
        const matrixRes = await fetch(matrixUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const matrixJson = await matrixRes.json();
        const matrixResult = matrixJson[0] || matrixJson;

        // Filter channels to only include the required ones
        const requiredChannels = ['Direct', 'Unassigned', 'Organic Search', 'Organic Social', 'Paid Search', 'Paid Social'];
        const filteredChannels = channelData.channels_found?.filter(channel => 
          requiredChannels.includes(channel)
        ) || [];

        // Process time series data
        const processedData = {};
        
        // Process channel data
        if (channelData.time_series) {
          channelData.time_series.forEach(dayData => {
            const date = dayData.date;
            processedData[date] = { date };
            
            if (dayData.channels) {
              filteredChannels.forEach(channel => {
                if (dayData.channels[channel]) {
                  processedData[date][channel] = dayData.channels[channel].totalRevenueUSD || 0;
                }
              });
            }
          });
        }

        // Add total revenue data
        if (revenueData && Array.isArray(revenueData)) {
          revenueData.forEach(item => {
            if (processedData[item.date]) {
              processedData[item.date].totalRevenue = item.value || 0;
            } else {
              processedData[item.date] = {
                date: item.date,
                totalRevenue: item.value || 0
              };
            }
          });
        }

        // Convert to array and sort by date
        const chartArray = Object.values(processedData).sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );

        setChartData(chartArray);
        setMatrixData(matrixResult);

        // ✅ Cache the data using setCacheState directly
        const dataToCache = {
          chartData: chartArray,
          matrixData: matrixResult,
          timestamp: Date.now()
        };
        
        // Use setCacheState to directly set the cache
        setCache(cacheKey, dataToCache);
        console.log('[ROI Analytics] Data cached successfully with key:', cacheKey);

      } catch (err) {
        console.error("Failed to fetch ROI Analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && adsCustomerId && token) {
      fetchData();
    }
  }, [propertyId, adsCustomerId, token, period, customDates?.startDate, customDates?.endDate, getRawCacheData, setCache]);


  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
          <p className="font-semibold">
            {label ? `${label.slice(0, 4)}-${label.slice(4, 6)}-${label.slice(6, 8)}` : ""}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center">
              <span
                className="w-3 h-3 mr-1 rounded-sm"
                style={{ backgroundColor: entry.stroke }}
              ></span>
              {entry.name}: ${entry.value?.toLocaleString() || 0}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };


  const MetricCard = ({ label, value, bgColor }) => (
    <div className={`p-4 rounded-lg shadow-sm border-l-4 border-[#508995]`} style={{ backgroundColor: bgColor }}>
      <div className="font-bold opacity-80 mb-1 text-black">{label}</div>
      <div className="text-xl font-bold text-[#508995]">{value}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 bg-white rounded-lg">
        <div className="relative">
          {/* Animated loading spinner */}
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#1A4752] rounded-full animate-spin"></div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-[#1A4752]">Loading ROI Analytics</p>
          <p className="text-sm text-gray-500 mt-1">Fetching data from multiple sources...</p>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#1A4752] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#2B889C] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#58C3DB] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  return (
    <div className="w-full">
      {/* Back button with brand colors */}
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          style={{ background: "linear-gradient(135deg, #1A4752 0%, #2B889C 50%, #58C3DB 100%)" }}
        >
          <ArrowLeft size={16} />
          Change Ad Account
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-black">Revenue Analytics</h3>
        <div className="flex items-center text-xs flex-wrap gap-2">
          {Object.keys(channelColors).map((channel) => (
            <div
              key={channel}
              className="flex items-center select-none cursor-pointer"
              onClick={() => setShowChannels(prev => ({ ...prev, [channel]: !prev[channel] }))}
            >
              <div 
                className="w-3 h-3 mr-1 rounded" 
                style={{ backgroundColor: showChannels[channel] ? channelColors[channel] : "#ccc" }}
              ></div>
              <span 
                style={{ 
                  ...labelBaseStyle, 
                  color: showChannels[channel] ? "#000" : "#888", 
                  textDecoration: showChannels[channel] ? "none" : "line-through" 
                }}
              >
                {channel === 'totalRevenue' ? 'Total Revenue' : channel}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <hr className="mb-4" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: "#000" }} 
                  axisLine={{ stroke: "#000" }} 
                  tickLine={{ stroke: "#000" }}
                  tickFormatter={(dateStr) => {
                    if (!dateStr) return "";
                    // Ensure it's 8 digits: YYYYMMDD
                    const year = dateStr.slice(0, 4);
                    const month = dateStr.slice(4, 6);
                    const day = dateStr.slice(6, 8);
                    return `${year}-${month}-${day}`;
                  }}
                />

                <YAxis 
                  tick={{ fontSize: 10, fill: "#000" }} 
                  axisLine={{ stroke: "#000" }} 
                  tickLine={{ stroke: "#000" }} 
                />
                <Tooltip content={<CustomLineTooltip />} />
                
                {/* Render lines for each channel */}
                {Object.keys(channelColors).map((channel) => (
                  showChannels[channel] && (
                    <Line
                      key={channel}
                      type="monotone"
                      dataKey={channel}
                      stroke={channelColors[channel]}
                      strokeWidth={2}
                      dot={false}
                      name={channel === 'totalRevenue' ? 'Total Revenue' : channel}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard 
              label="ROI - Search" 
              value={`${matrixData?.roi || 0}%`} 
              bgColor="#B4B4B4" 
            />
            <MetricCard 
              label="ROAS - Search" 
              value={matrixData?.roas || "0:1"} 
              bgColor="#B4B4B4" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard 
              label="Total Revenue" 
              value={`$${matrixData?.totalRevenue?.toLocaleString() || 0}`} 
              bgColor="#B4B4B4" 
            />
            <MetricCard 
              label="Total Adspend" 
              value={`$${matrixData?.adSpend?.toLocaleString() || 0}`} 
              bgColor="#B4B4B4" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard 
              label="Revenue Per User" 
              value={`$${matrixData?.revenuePerUser || 0}`} 
              bgColor="#B4B4B4" 
            />
            <MetricCard 
              label="Total Purchasers" 
              value={matrixData?.totalPurchasers?.toLocaleString() || 0} 
              bgColor="#B4B4B4" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard 
              label="Active Users" 
              value={matrixData?.activeUsers?.toLocaleString() || 0} 
              bgColor="#B4B4B4" 
            />
            <MetricCard 
              label="Avg. Purchase / A.U" 
              value={`$${matrixData?.averagePurchaseRevenuePerActiveUser || 0}`} 
              bgColor="#B4B4B4" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main ROI Analytics Component that handles account selection
export default function ROIAnalytics({ activeProperty, period, customDates }) {
  // ✅ ADD THIS LOG
  console.log('[ROIAnalytics] Props received:', { activeProperty, period, customDates });

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const token = localStorage.getItem("token");

  // Load cached account selection from localStorage
  useEffect(() => {
    const savedAccount = localStorage.getItem('roiAnalytics_selectedAccount');
    if (savedAccount && activeProperty) {
      try {
        const parsed = JSON.parse(savedAccount);
        // Only restore if the property matches
        if (parsed.propertyId === activeProperty.id) {
          setSelectedAccount(parsed);
          console.log('[ROI Analytics] Restored cached account selection:', parsed);
        }
      } catch (err) {
        console.error('Error parsing saved account:', err);
      }
    }
  }, [activeProperty]);

  // Save selected account to localStorage
  useEffect(() => {
    if (selectedAccount) {
      localStorage.setItem('roiAnalytics_selectedAccount', JSON.stringify(selectedAccount));
      console.log('[ROI Analytics] Saved account selection to localStorage:', selectedAccount);
    }
  }, [selectedAccount]);

  // Fetch campaigns when component mounts
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/ads/customers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data);
        }
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    if (token) {
      fetchCampaigns();
    }
  }, [token]);

  // Create combined accounts from active property and campaigns
  const accounts = [];
  
  if (activeProperty && campaigns.length > 0) {
    campaigns.forEach(campaign => {
      accounts.push({
        propertyId: activeProperty.id,
        propertyName: `${campaign.name} (${activeProperty.name})`,
        adsCustomerId: campaign.id,
        timeZone: "Asia/Colombo",
        type: "combined"
      });
    });
  }

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setShowDropdown(false);
    console.log('[ROI Analytics] Account selected:', account);
  };

  const handleBackToSelection = () => {
    setSelectedAccount(null);
    // Clear the saved account when user goes back
    localStorage.removeItem('roiAnalytics_selectedAccount');
    console.log('[ROI Analytics] Cleared account selection');
  };

  if (!activeProperty) {
    return (
      <div className="bg-white rounded-xl min-h-96 flex items-center justify-center">
        <p className="text-center text-gray-500">Please select a property to view ROI Analytics</p>
      </div>
    );
  }

  if (loadingCampaigns) {
    return (
      <div className="bg-white rounded-xl min-h-96 flex items-center justify-center">
        <p className="text-center text-gray-500">Loading campaigns...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl min-h-96 flex items-center justify-center">
        <p className="text-center text-gray-500">No Google Ads campaigns available for ROI Analytics</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl min-h-96">
      {!selectedAccount && (
        <div className="min-h-96 flex flex-col justify-center items-center p-2">
          <div className="relative w-lg mb-8 p-2 rounded-lg border-2 border-[#1A4752] bg-gradient-to-r from-[#1A4752] to-[#2B889C]">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full text-white px-6 py-2 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all font-bold"
              style={{ background: "linear-gradient(135deg, #1A4752 0%, #2B889C 50%, #58C3DB 100%)" }}
            >
              <span className="mb-1">Select the Ad Campaign Account</span>
              <AiOutlineCaretDown 
                className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} 
                size={24} 
              />
            </button>

            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {accounts.map((account, index) => (
                    <div
                      key={index}
                      onClick={() => handleAccountSelect(account)}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-lg">
                            {account.propertyName}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Property ID: {account.propertyId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ads ID: {account.adsCustomerId}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
                          {account.timeZone}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {selectedAccount && (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full">
          <ROIAnalyticsInner
            propertyId={selectedAccount.propertyId}
            adsCustomerId={selectedAccount.adsCustomerId}
            onBack={handleBackToSelection}
            period={period}
            customDates={customDates}  // Add this line
          />
        </div>
      )}
    </div>
  );
}