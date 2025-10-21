import React from "react";
import MetricCard from "../components/MetricCard";
import CampaignMetrics from "../components/CampaignMetrics";
import DevicePieChart from "../components/DevicePieChart";
import LineChartComp from "../components/LineChart";
import KeywordTable from "../components/KeywordTable";
import AIChatComponent from "../components/AIChatComponent";
import CampaignProgressChart from "../components/CampaignProgressChart";
import CampaignPerformanceDetails from "../components/CampaignPerformanceDetails";
import { useApiWithCache } from "../hooks/useApiWithCache";

const convertPeriodForAPI = (period) => {
  console.log('🔄 [convertPeriodForAPI] Input period:', period);
  
  const periodMap = {
    LAST_7_DAYS: "LAST_7_DAYS",
    LAST_30_DAYS: "LAST_30_DAYS",
    LAST_90_DAYS: "LAST_90_DAYS",  // Fix: was LAST_3_MONTHS
    LAST_365_DAYS: "LAST_365_DAYS", // Fix: was LAST_1_YEAR
    LAST_3_MONTHS: "LAST_90_DAYS",   // Add mapping
    LAST_1_YEAR: "LAST_365_DAYS",    // Add mapping
    CUSTOM: "CUSTOM",
  };
  
  const result = periodMap[period] || period;
  console.log('🔄 [convertPeriodForAPI] Output period:', result);
  return result;
};

export default function GoogleAds({ activeCampaign, period, customDates }) {
  console.log('📊 [GoogleAds] Component rendered with:', {
    period,  // Add this log
    customDates
  });

  // Move keyStatsApiCall inside component to access period correctly
  const keyStatsApiCall = async (customerId, periodParam, customDatesParam) => {
    console.log('🎯 [keyStatsApiCall] Called with:', {
      customerId,
      periodParam,
      customDatesParam,
      originalPeriod: period  // Add this to see original period
    });
    
    const token = localStorage.getItem("token");
    
    // Use periodParam from the hook, not period from props
    const convertedPeriod = convertPeriodForAPI(periodParam);
    
    console.log('🔄 [keyStatsApiCall] After conversion:', {
      input: periodParam,
      output: convertedPeriod
    });

    // Build URL
    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/key-stats/${customerId}?period=${convertedPeriod}`;
    
    if (convertedPeriod === 'CUSTOM' && customDatesParam?.startDate && customDatesParam?.endDate) {
      url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
    }

    console.log('📡 [keyStatsApiCall] Final URL:', url);

    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ API Error:', res.status, errorText);
      throw new Error(`Network response was not ok: ${res.status}`);
    }
    
    const json = await res.json();
    console.log('✅ Key stats response:', json);

    return {
      impressions: json.total_impressions?.formatted || "-",
      cost: json.total_cost?.formatted || "-",
      clicks: json.total_clicks?.formatted || "-",
      conversionRate: json.conversion_rate?.formatted || "-",
      conversions: json.total_conversions?.formatted || "-",
      cpc: json.avg_cost_per_click?.formatted || "-",
      costPerConv: json.cost_per_conversion?.formatted || "-",
      ctr: json.click_through_rate?.formatted || "-",
    };
  };

  const { data: metrics, loading, error } = useApiWithCache(
    activeCampaign?.customerId || activeCampaign?.id,
    period,
    "key-stats",
    keyStatsApiCall,
    { customDates }
  );

  if (!activeCampaign) {
    return (
      <div className="text-white p-4">
        Please select a campaign to view Google Ads analytics
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-red-800 font-medium">Error loading key stats</div>
              <div className="text-red-600 text-sm mt-1">{error.message}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !metrics) {
    return (
      <div className="p-4 lg:p-6 animate-pulse space-y-4 lg:space-y-6">
        {/* Metrics Loading Skeleton - 12-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>

        {/* Charts Loading Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 rounded-xl bg-gray-200 dark:bg-gray-700 h-72"></div>
          <div className="lg:col-span-1 rounded-xl bg-gray-200 dark:bg-gray-700 h-72"></div>
        </div>

        <div className="rounded-xl bg-gray-200 dark:bg-gray-700 h-80"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1 rounded-xl bg-gray-200 dark:bg-gray-700 h-72"></div>
          <div className="lg:col-span-2 rounded-xl bg-gray-200 dark:bg-gray-700 h-72"></div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
          <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Campaign Key Metrics Section - 12-column grid system */}
      <section className="space-y-4">
        {/* Primary Metrics Row - 4 columns on xl, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="col-span-1">
            <MetricCard 
              title="Total Impressions" 
              subtitle="Reach and Visibility" 
              value={metrics?.impressions} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Total Cost" 
              subtitle="Budget utilization" 
              value={metrics?.cost} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Total Clicks" 
              subtitle="User engagement" 
              value={metrics?.clicks} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Conversion Rate" 
              subtitle="Campaign effectiveness" 
              value={metrics?.conversionRate} 
              isLoading={loading}
            />
          </div>
        </div>

        {/* Secondary Metrics Row - 4 columns on xl, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="col-span-1">
            <MetricCard 
              title="Total Conversions" 
              subtitle="Goal achievements" 
              value={metrics?.conversions} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Avg. Cost Per Click" 
              subtitle="Bidding efficiency" 
              value={metrics?.cpc} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Cost Per Conv." 
              subtitle="ROI efficiency" 
              value={metrics?.costPerConv} 
              isLoading={loading}
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Click-Through Rate" 
              subtitle="Ad relevance" 
              value={metrics?.ctr} 
              isLoading={loading}
            />
          </div>
        </div>
      </section>

      {/* Campaign Performance Overview Section - 3-column grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 min-h-[300px]">
            <CampaignMetrics 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
          <div className="lg:col-span-1 min-h-[300px]">
            <DevicePieChart 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
        </div>
      </section>

      {/* Performance Over Time Section - Full width */}
      <section className="space-y-4">
        <div className="grid grid-cols-1">
          <div className="col-span-1 min-h-[350px]">
            <LineChartComp 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
        </div>
      </section>

      {/* Campaign Progress & Performance Details Section - 3-column grid */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1 min-h-[300px]">
            <CampaignProgressChart 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
          <div className="lg:col-span-2 min-h-[300px]">
            <CampaignPerformanceDetails 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
        </div>
      </section>

      {/* Keywords Analysis Section - Full width */}
      <section className="space-y-4">
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <KeywordTable 
              activeCampaign={activeCampaign} 
              period={period}
              customDates={customDates}
            />
          </div>
        </div>
      </section>

      {/* AI Campaign Insights Section - Full width */}
      <section className="space-y-4">
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <AIChatComponent 
              chatType="ads"
              activeCampaign={activeCampaign}
              period={period}
              customDates={customDates}
            />
          </div>
        </div>
      </section>
    </div>
  );
}