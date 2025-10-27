import React, { useState, useEffect } from "react";
import { useApiWithCache } from "../hooks/useApiWithCache";
import { useCache } from "../context/CacheContext";

const UserEngagement = ({ activeProperty, period, customDates }) => {
  const [showMessage, setShowMessage] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("selection");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [funnelError, setFunnelError] = useState(null);

  const { getFromCacheAnalytics, setCacheAnalytics } = useCache();

  // Determine if this is a custom period
  const isCustomPeriod = period === 'CUSTOM' || period === 'custom';

  // Fetch initial conversions data using the cache hook
  const { data: conversionsData, loading: conversionsLoading, error: conversionsError } = useApiWithCache(
    activeProperty?.id,
    period,
    'conversions',
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/conversions/${propertyId}?period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDatesParam?.startDate && customDatesParam?.endDate) {
        url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
      }
      
      console.log(`[UserEngagement] Fetching conversions from: ${url}`);
      
      const res = await fetch(url, {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: false,
      customDates: isCustomPeriod ? customDates : null
    }
  );

  // Check for cached funnel data on component mount and when dependencies change
  useEffect(() => {
    if (activeProperty?.id && period) {
      const convertPeriodToAnalytics = (period) => {
        const periodMap = {
          'LAST_7_DAYS': '7d',
          'LAST_30_DAYS': '30d', 
          'LAST_3_MONTHS': '90d',
          'LAST_1_YEAR': '365d',
          'CUSTOM': 'custom'
        };
        return periodMap[period] || '7d';
      };
      
      const analyticsPeriod = convertPeriodToAnalytics(period);
      
      // Get cached funnel data - pass customDates for custom periods
      const cachedFunnelData = getFromCacheAnalytics(
        activeProperty.id, 
        period, 
        'funnel',
        isCustomPeriod ? customDates : null
      );
      
      console.log('[UserEngagement] Checking cached funnel:', {
        propertyId: activeProperty.id,
        period,
        isCustomPeriod,
        customDates,
        cachedData: cachedFunnelData
      });
      
      if (cachedFunnelData && cachedFunnelData.funnelData && cachedFunnelData.selectedLabels) {
        console.log('[UserEngagement] Loading funnel from cache');
        setFunnelData(cachedFunnelData.funnelData);
        setSelectedLabels(cachedFunnelData.selectedLabels);
        setCurrentScreen("funnel");
      } else {
        console.log('[UserEngagement] No cached funnel found, showing selection');
        setCurrentScreen("selection");
        setSelectedLabels([]);
        setFunnelData(null);
      }
    }
  }, [activeProperty?.id, period, customDates?.startDate, customDates?.endDate, getFromCacheAnalytics, isCustomPeriod]);

  // Transform conversions data for display
  const allFunnelData = conversionsData ? conversionsData.map((item) => ({
    label: item.eventName,
    value: item.eventCount,
    percent: item.eventCountRate?.toFixed(2) + "%",
    drop: null,
  })) : [];

  const toggleLabelSelection = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const generateFunnel = async () => {
    if (selectedLabels.length === 0) return;

    setFunnelLoading(true);
    setFunnelError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      const convertPeriodToAnalytics = (period) => {
        const periodMap = {
          'LAST_7_DAYS': '7d',
          'LAST_30_DAYS': '30d', 
          'LAST_3_MONTHS': '90d',
          'LAST_1_YEAR': '365d',
          'CUSTOM': 'custom'
        };
        return periodMap[period] || '7d';
      };
      
      const analyticsPeriod = convertPeriodToAnalytics(period);
      
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/analytics/funnel/${activeProperty.id}?period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDates?.startDate && customDates?.endDate) {
        url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
      }
      
      console.log(`[UserEngagement] Generating funnel with URL: ${url}`);
      console.log(`[UserEngagement] Selected events:`, selectedLabels);
      
      const requestBody = {
        selected_events: selectedLabels,
        conversions_data: conversionsData
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch funnel data: ${res.status}`);
      }

      const data = await res.json();
      console.log('[UserEngagement] Funnel data received:', data);
      
      setFunnelData(data);
      
      // Cache the funnel data with selected labels - pass customDates for custom periods
      setCacheAnalytics(
        activeProperty.id, 
        period, 
        'funnel', 
        {
          funnelData: data,
          selectedLabels: selectedLabels
        },
        isCustomPeriod ? customDates : null
      );
      
      console.log('[UserEngagement] Funnel data cached with key:', {
        propertyId: activeProperty.id,
        period,
        isCustomPeriod,
        customDates,
        endpoint: 'funnel'
      });
      
      setCurrentScreen("funnel");
    } catch (err) {
      console.error("[UserEngagement] Failed to generate funnel:", err);
      setFunnelError(err.message);
    } finally {
      setFunnelLoading(false);
    }
  };

  const resetSelection = () => {
    setCurrentScreen("selection");
    setSelectedLabels([]);
    setFunnelData(null);
    setFunnelError(null);
  };

  const getSelectedFunnelData = () => {
    if (!funnelData?.data?.funnel_stages) return [];
    
    return funnelData.data.funnel_stages.map((stage) => ({
      label: stage.stage_name,
      value: stage.count,
      percent: stage.percentage_of_total?.toFixed(2) + "%",
      drop: stage.drop_off_percentage?.toFixed(2) + "%",
      conversions: stage.conversions || 0,
      conversionRate: stage.conversion_rate?.toFixed(2) + "%",
      revenue: stage.revenue || 0
    }));
  };

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-[#1A4752] border-opacity-20 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-[#2B889C] rounded-full animate-spin"></div>
        <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-[#58C3DB] rounded-full animate-spin animation-delay-150"></div>
      </div>
    </div>
  );

  // Handle loading state
  if (conversionsLoading) {
    return (
      <div className="w-full max-w-5xl px-4 py-6 mx-auto bg-white rounded-lg shadow-lg">
        <h3 className="font-semibold text-black mb-4">User Engagement Funnel</h3>
        <p className="text-center text-[#1A4752] mt-4">Loading funnel data...</p>
      </div>
    );
  }

  // Handle error state
  if (conversionsError || !activeProperty) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-center py-10 text-red-600">
          {!activeProperty ? "Please select a property to view user engagement funnel" : "Failed to load conversion data"}
        </div>
      </div>
    );
  }

  // ---------------- SELECTION SCREEN ----------------
  if (currentScreen === "selection") {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-[#1A4752]">User Engagement Funnel</h3>
          <div className="relative">
           <button
            onClick={() => setShowMessage(!showMessage)}
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
          >
            <img src="/images/ai.png" alt="AI Assistant" className="w-6 h-6" />
            <span className="absolute inset-0 rounded-full animate-ping bg-[#2B889C] opacity-50"></span>
          </button>
          </div>
        </div>

        {showMessage && (
          <div className="absolute top-20 right-4 bg-[#2B889C] text-white p-4 rounded-lg text-center animate-pulse z-50">
            🤖 Hi! I'm your AI Assistant. How can I help?
          </div>
        )}

        <hr className="border-t-1 border-[#1A4752] mb-6" />

        {/* Loading state for generation - inline */}
        {funnelLoading && (
          <div className="mb-8 p-8 bg-gray-50 rounded-lg border-2 border-[#58C3DB]">
            <LoadingSpinner />
            <p className="text-center text-[#1A4752] mt-4 font-semibold">Generating your funnel...</p>
          </div>
        )}

        {/* Only show label selection if not loading */}
        {!funnelLoading && (
          <div className="mb-8">
            {allFunnelData.length > 0 ? (
              <>
                <h4 className="text-normal font-semibold mb-4 text-[#1A4752]">
                  Select events to include in your funnel:
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {allFunnelData.map((item) => (
                    <div
                      key={item.label}
                      onClick={() => toggleLabelSelection(item.label)}
                      className="flex items-center space-x-2 p-3 cursor-pointer hover:bg-gray-50 rounded-lg border-2 border-transparent hover:border-[#58C3DB] transition-all"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedLabels.includes(item.label)
                            ? "bg-[#2B889C] border-[#2B889C]"
                            : "bg-gray-100 border-gray-300"
                        }`}
                      >
                        {selectedLabels.includes(item.label) && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm text-[#1A4752]">{item.label}</div>
                        <div className="text-xs text-gray-600">
                          {item.value.toLocaleString()} events ({item.percent})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg 
                  className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Conversion Events Available
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  There are no conversion events recorded for this property during the selected time period. 
                  Try selecting a different date range or ensure conversion tracking is properly configured.
                </p>
              </div>
            )}
          </div>
        )}


        {/* Error Display */}
        {funnelError && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Error generating funnel: {funnelError}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateFunnel}
            disabled={selectedLabels.length === 0 || funnelLoading}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              selectedLabels.length === 0 || funnelLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#1A4752] to-[#2B889C] text-white hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
          >
            {funnelLoading ? "Generating..." : "Generate Funnel"}
          </button>
        </div>
      </div>
    );
  }

  // ---------------- FUNNEL SCREEN ----------------
  const selectedFunnelData = getSelectedFunnelData();

  return (
    <div className="w-full p-4 mx-auto bg-white rounded-lg relative">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-[#1A4752]">User Engagement Funnel</h3>
          <button
            onClick={resetSelection}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            ← Back to Selection
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMessage(!showMessage)}
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
          >
            <img src="/images/ai.png" alt="AI Assistant" className="w-6 h-6" />
            <span className="absolute inset-0 rounded-full animate-ping bg-[#2B889C] opacity-50"></span>
          </button>
        </div>
      </div>

      {showMessage && (
        <div className="absolute top-20 right-4 bg-[#2B889C] text-white p-4 rounded-lg text-center animate-pulse z-50">
          🤖 Hi! I'm your AI Assistant. How can I help?
        </div>
      )}

      <hr className="border-t-1 border-[#1A4752] mb-4" />

      <div className="grid">
        {/* LEFT SIDE - Funnel Visualization */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-[#1A4752] mb-4">Funnel Flow</h4>
          
          {/* Funnel Visualization */}
          {selectedFunnelData.length > 0 ? (
            <div className="space-y-3 bg-white p-4 rounded-lg">
              {selectedFunnelData.map((item, index) => {
                const width = Math.max(100 - index * 8, 20);
                const nextWidth = index < selectedFunnelData.length - 1 
                  ? Math.max(100 - (index + 1) * 8, 20) 
                  : Math.max(width - 10, 15);

                const colors = ['#1A4752', '#2B889C', '#58C3DB'];
                const bgColor = colors[index % colors.length];

                return (
                  <div key={item.label} className="flex items-center">
                    <div className="w-32 text-right pr-4">
                      <div className="font-bold text-[#1A4752] text-sm">{item.label}</div>
                      {item.drop !== "0.00%" && index > 0 && (
                        <div className="text-xs text-red-600 font-medium">Drop: {item.drop}</div>
                      )}
                    </div>

                    <div className="flex-1 flex justify-center items-center">
                      <div
                        className="text-white text-sm font-medium flex flex-col items-center justify-center relative shadow-lg"
                        style={{
                          backgroundColor: bgColor,
                          width: `${width * 3}px`,
                          height: "60px",
                          clipPath: `polygon(${(100 - width) / 2}% 0%, ${
                            100 - (100 - width) / 2
                          }% 0%, ${100 - (100 - nextWidth) / 2}% 100%, ${
                            (100 - nextWidth) / 2
                          }% 100%)`,
                        }}
                      >
                        <div className="font-bold text-lg">{item.value.toLocaleString()}</div>
                        <div className="text-xs opacity-90">{item.percent}</div>
                      </div>
                    </div>

                    <div className="w-24 text-left pl-3">
                      <div className="text-sm font-bold text-[#1A4752]">{item.percent}</div>
                      {item.conversions > 0 && (
                        <div className="text-xs text-green-600 font-medium">
                          Conv: {item.conversions}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg">
              No funnel data available
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Card Details and Selected Events */}

      </div>
    </div>
  );
};

export default UserEngagement;