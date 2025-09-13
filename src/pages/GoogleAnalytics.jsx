import React from "react";
import MetricCard from "../components/MetricCard";
import DevicePieChart from "../components/DevicePieChart";
import KeywordTable from "../components/KeywordTable";
import SummaryPanel from "../components/SummaryPanel";
import TrafficPerformanceBarChart from "../components/TrafficPerfomanceBarChart";
import TrafficBreakdownPie from "../components/TrafficBreakdownPie";
import AnalyticsOvertime from "../components/AnalyticsOvertime";
import UserEngagement from "../components/UserEngagement";
import ROIAnalytics from "../components/ROIAnalytics";
import GeographicalDetailsCard from "../components/GeographicalDetailsCard";
import AudienceInsightsCard from "../components/AudienceInsightsCard";
import DevicePerformancePie from "../components/DeviceperformancePie";
import { useApiWithCache } from "../hooks/useApiWithCache";

export default function GoogleAnalytics({ activeProperty, period }) {
  // Fetch metrics using the universal API hook
  const { data: metrics, loading: metricsLoading, error: metricsError } = useApiWithCache(
    activeProperty?.id,
    period,
    'metrics',
    async (propertyId, analyticsPeriod) => {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/metrics/${propertyId}?period=${analyticsPeriod}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
            : { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: true
    }
  );

  if (!activeProperty) {
    return <div className="text-white p-4">Please select a property to view analytics</div>;
  }

  if (metricsLoading) {
    return <p className="text-center text-gray-500 mt-20">Loading analytics data...</p>;
  }

  if (metricsError || !metrics) {
    return <p className="text-center text-red-500 mt-20">Failed to load analytics data.</p>;
  }

  return (
    <div>
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers?.toLocaleString() || "0"}
          subtitle={`Total Users Change: ${metrics.totalUsersChange || "N/A"}`}
        />
        <MetricCard
          title="Sessions"
          value={metrics.sessions?.toLocaleString() || "0"}
          subtitle={`Sessions Per User: ${metrics.sessionsPerUser || "N/A"}`}
        />
        <MetricCard
          title="Engaged Sessions"
          value={metrics.engagedSessions?.toLocaleString() || "0"}
          subtitle={`Engaged Percentage: ${metrics.engagedSessionsPercentage || "N/A"}`}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.engagementRate?.toFixed(2) || "0"}%`}
          subtitle={`Engagement Rate Status: ${metrics.engagementRateStatus || "N/A"}`}
        />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Pages Per Session"
          value={metrics.pagesPerSession || "0"}
          subtitle={`Content Depth Status: ${metrics.contentDepthStatus || "N/A"}`}
        />
        <MetricCard
          title="Avg. Session Duration (s)"
          value={metrics.averageSessionDuration?.toFixed(2) || "0"}
          subtitle={`Session Duration Quality: ${metrics.sessionDurationQuality || "N/A"}`}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.bounceRate?.toFixed(2) || "0"}%`}
          subtitle={`Bounce Rate Status: ${metrics.bounceRateStatus || "N/A"}`}
        />
        <MetricCard
          title="Views Per Session"
          value={metrics.viewsPerSession || "0"}
          subtitle={`Session Quality Score: ${metrics.sessionQualityScore || "N/A"}`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-[65%_33.5%] gap-6 mt-6">
        <TrafficPerformanceBarChart activeProperty={activeProperty} period={period} />
        <TrafficBreakdownPie activeProperty={activeProperty} period={period} />
      </div>

      {/* Analytics Over Time */}
      <div className="mt-6">
        <AnalyticsOvertime activeProperty={activeProperty} period={period} />
      </div>

      {/* Charts Row 2 - Pass property data to DevicePerformancePie */}
      <div className="grid grid-cols-[33.5%_65%] gap-6 mt-6">
        <DevicePerformancePie activeProperty={activeProperty} 
          period={period} 
          isAnalytics={true}
        />
        <UserEngagement activeProperty={activeProperty} period={period} />
      </div>

      {/* Funnel & ROAS */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <ROIAnalytics activeProperty={activeProperty} period={period} />
      </div>

      {/* Generated Insights */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <SummaryPanel activeProperty={activeProperty} period={period} />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <GeographicalDetailsCard activeProperty={activeProperty} period={period} />
        <AudienceInsightsCard activeProperty={activeProperty} period={period} />
      </div>
    </div>
  );
}