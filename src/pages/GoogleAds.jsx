import React, { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";
import CampaignMetrics from "../components/CampaignMetrics";
import DevicePieChart from "../components/DevicePieChart";
import LineChartComp from "../components/LineChart";
import KeywordTable from "../components/KeywordTable";
import SummaryPanel from "../components/SummaryPanel";
import CampaignProgressChart from "../components/CampaignProgressChart";
import CampaignPerformanceDetails from "../components/CampaignPerformanceDetails";
import { useApiWithCache } from "../hooks/useApiWithCache";

export default function GoogleAds({ activeCampaign, period }) {

  // Add the period conversion function
  const convertPeriodForAPI = (period) => {
    const periodMap = {
      'LAST_7_DAYS': 'LAST_7_DAYS',
      'LAST_30_DAYS': 'LAST_30_DAYS',
      'LAST_3_MONTHS': 'LAST_90_DAYS',
      'LAST_1_YEAR': 'LAST_365_DAYS'
    };
    return periodMap[period] || period;
  };

  const keyStatsApiCall = async (customerId, period) => {
    const token = localStorage.getItem("token");
    const convertedPeriod = convertPeriodForAPI(period);
    
    const res = await fetch(
      `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/key-stats/${customerId}?period=${convertedPeriod}`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
          : { "Content-Type": "application/json" },
      }
    );

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

  const { data: metrics, loading } = useApiWithCache(
    activeCampaign?.id,
    period,
    'key-stats',
    keyStatsApiCall
  );

  if (loading) return <p>Loading campaign metrics...</p>;

  return (
    <>
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Impressions" subtitle="Reach and Visibility" value={metrics?.impressions} />
        <MetricCard title="Total Cost" subtitle="Budget utilization" value={metrics?.cost} />
        <MetricCard title="Total Clicks" subtitle="User engagement" value={metrics?.clicks} />
        <MetricCard title="Conversion Rate" subtitle="Campaign effectiveness" value={metrics?.conversionRate} />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <MetricCard title="Total Conversions" subtitle="Goal achievements" value={metrics?.conversions} />
        <MetricCard title="Avg. Cost Per Click" subtitle="Bidding efficiency" value={metrics?.cpc} />
        <MetricCard title="Cost Per Conv." subtitle="ROI efficiency" value={metrics?.costPerConv} />
        <MetricCard title="Click-Through Rate" subtitle="Ad relevance" value={metrics?.ctr} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-[65%_33.5%] gap-6 mt-6">
        <CampaignMetrics activeCampaign={activeCampaign} period={period} />
        <DevicePieChart activeCampaign={activeCampaign} period={period} />
      </div>

      {/* Performance Over Time */}
      <div className="mt-6">
        <LineChartComp activeCampaign={activeCampaign} period={period} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-[33.5%_65%] gap-6 mt-6">
        <CampaignProgressChart activeCampaign={activeCampaign} period={period} />
        <CampaignPerformanceDetails activeCampaign={activeCampaign} period={period} />
      </div>

      {/* Keywords & Summary */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <KeywordTable activeCampaign={activeCampaign} period={period} />
        <SummaryPanel campaign={activeCampaign} />
      </div>
    </>
  );
}