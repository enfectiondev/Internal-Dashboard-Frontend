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

export default function GoogleAds({ activeCampaign, period, customDates }) {

  // Convert frontend period → API period
  const convertPeriodForAPI = (period) => {
    const periodMap = {
      LAST_7_DAYS: "LAST_7_DAYS",
      LAST_30_DAYS: "LAST_30_DAYS",
      LAST_3_MONTHS: "LAST_90_DAYS",
      LAST_1_YEAR: "LAST_365_DAYS",
      CUSTOM: "CUSTOM",
    };
    return periodMap[period] || period;
  };

  const keyStatsApiCall = async (customerId, cacheKeyOrPeriod) => {
    const token = localStorage.getItem("token");
    const actualPeriod = cacheKeyOrPeriod.startsWith('CUSTOM-') ? 'CUSTOM' : cacheKeyOrPeriod;
    const convertedPeriod = convertPeriodForAPI(actualPeriod);

    // Build URL with custom date parameters if needed
    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/key-stats/${customerId}?period=${convertedPeriod}`;
    
    if (convertedPeriod === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }

    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    const json = await res.json();

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

  // Create cache key that includes custom dates
  const shouldBypassCache = period === 'CUSTOM';
  const cacheKey = shouldBypassCache 
    ? `CUSTOM-${Date.now()}` // Use timestamp to always bypass cache
    : period;

  const { data: metrics, loading } = useApiWithCache(
    activeCampaign?.id,
    cacheKey,
    "key-stats",
    keyStatsApiCall
  );

  if (!activeCampaign) {
    return (
      <div className="text-white p-4">
        Please select a campaign to view Google Ads analytics
      </div>
    );
  }

  if (loading) {
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
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Total Cost" 
              subtitle="Budget utilization" 
              value={metrics?.cost} 
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Total Clicks" 
              subtitle="User engagement" 
              value={metrics?.clicks} 
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Conversion Rate" 
              subtitle="Campaign effectiveness" 
              value={metrics?.conversionRate} 
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
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Avg. Cost Per Click" 
              subtitle="Bidding efficiency" 
              value={metrics?.cpc} 
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Cost Per Conv." 
              subtitle="ROI efficiency" 
              value={metrics?.costPerConv} 
            />
          </div>
          <div className="col-span-1">
            <MetricCard 
              title="Click-Through Rate" 
              subtitle="Ad relevance" 
              value={metrics?.ctr} 
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