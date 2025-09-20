import React from "react";
import MetricCard from "../components/MetricCard";
import DevicePieChart from "../components/DevicePieChart";
import KeywordTable from "../components/KeywordTable";
import AIChatComponent from "../components/AIChatComponent";
import TrafficPerformanceBarChart from "../components/TrafficPerfomanceBarChart";
import TrafficBreakdownPie from "../components/TrafficBreakdownPie";
import AnalyticsOvertime from "../components/AnalyticsOvertime";
import UserEngagement from "../components/UserEngagement";
import ROIAnalytics from "../components/ROIAnalytics";
import GeographicalDetailsCard from "../components/GeographicalDetailsCard";
import AudienceInsightsCard from "../components/AudienceInsightsCard";
import DevicePerformancePie from "../components/DevicePerformancePie";
import { useApiWithCache } from "../hooks/useApiWithCache";



export default function GoogleAnalytics({ activeProperty, period }) {
  const { data: metrics, loading: metricsLoading, error: metricsError } =
    useApiWithCache(
      activeProperty?.id,
      period,
      "metrics",
      async (propertyId, analyticsPeriod) => {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/metrics/${propertyId}?period=${analyticsPeriod}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                }
              : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok)
          throw new Error(`Network response was not ok: ${res.status}`);
        return await res.json();
      },
      {
        isAnalytics: true,
        convertPeriod: true,
      }
    );

  if (!activeProperty) {
    return (
      <div className="text-white p-4">
        Please select a property to view analytics
      </div>
    );
  }

  if (metricsLoading) {
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
          <div className="lg:col-span-1 rounded-xl bg-gray-200 dark:bg-gray-700 h-64"></div>
          <div className="lg:col-span-2 rounded-xl bg-gray-200 dark:bg-gray-700 h-64"></div>
        </div>
        
        <div className="rounded-xl bg-gray-200 dark:bg-gray-700 h-96"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (metricsError || !metrics) {
    return (
      <p className="text-center text-red-500 mt-20">
        Failed to load analytics data.
      </p>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Key Metrics Section - 12-column grid system */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Key Metrics
        </h2> */}
        
        {/* Primary Metrics Row - 4 columns on xl, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="col-span-1">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers?.toLocaleString() || "0"}
              subtitle={`Total Users Change: ${
                metrics.totalUsersChange || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Sessions"
              value={metrics.sessions?.toLocaleString() || "0"}
              subtitle={`Sessions Per User: ${
                metrics.sessionsPerUser || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Engaged Sessions"
              value={metrics.engagedSessions?.toLocaleString() || "0"}
              subtitle={`Engaged Percentage: ${
                metrics.engagedSessionsPercentage || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Engagement Rate"
              value={`${metrics.engagementRate?.toFixed(2) || "0"}%`}
              subtitle={`Engagement Rate Status: ${
                metrics.engagementRateStatus || "N/A"
              }`}
            />
          </div>
        </div>

        {/* Secondary Metrics Row - 4 columns on xl, 2 on sm, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="col-span-1">
            <MetricCard
              title="Pages Per Session"
              value={metrics.pagesPerSession || "0"}
              subtitle={`Content Depth Status: ${
                metrics.contentDepthStatus || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Avg. Session Duration (s)"
              value={metrics.averageSessionDuration?.toFixed(2) || "0"}
              subtitle={`Session Duration Quality: ${
                metrics.sessionDurationQuality || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Bounce Rate"
              value={`${metrics.bounceRate?.toFixed(2) || "0"}%`}
              subtitle={`Bounce Rate Status: ${
                metrics.bounceRateStatus || "N/A"
              }`}
            />
          </div>
          <div className="col-span-1">
            <MetricCard
              title="Views Per Session"
              value={metrics.viewsPerSession || "0"}
              subtitle={`Session Quality Score: ${
                metrics.sessionQualityScore || "N/A"
              }`}
            />
          </div>
        </div>
      </section>

      {/* Traffic Performance Section - 3-column grid */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Traffic Performance
        </h2> */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 min-h-[300px]">
            <TrafficPerformanceBarChart
              activeProperty={activeProperty}
              period={period}
            />
          </div>
          <div className="lg:col-span-1 min-h-[300px]">
            <TrafficBreakdownPie
              activeProperty={activeProperty}
              period={period}
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Analytics Over Time Section - Full width */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Analytics Over Time
        </h2> */}
        
        <div className="grid grid-cols-1">
          <div className="col-span-1 min-h-[350px]">
            <AnalyticsOvertime activeProperty={activeProperty} period={period} />
          </div>
        </div>
      </section>

      {/* Device Performance & User Engagement Section - 3-column grid */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Device Performance & User Engagement
        </h2> */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-1 min-h-[300px]">
            <DevicePerformancePie
              activeProperty={activeProperty}
              period={period}
              isAnalytics={true}
              className="w-full h-full"
            />
          </div>
          <div className="lg:col-span-2 min-h-[300px]">
            <UserEngagement activeProperty={activeProperty} period={period} />
          </div>
        </div>
      </section>

      {/* ROI Analytics Section - Full width */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ROI Analytics
        </h2> */}
        
        <div className="grid grid-cols-1">
          <div className="col-span-1 min-h-[400px]">
            <ROIAnalytics activeProperty={activeProperty} period={period} />
          </div>
        </div>
      </section>

      {/* Geographical & Audience Insights Section - 2-column grid */}
      <section className="space-y-4">
        {/* <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Geographical & Audience Insights
        </h2> */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="col-span-1 min-h-[300px]">
            <GeographicalDetailsCard
              activeProperty={activeProperty}
              period={period}
            />
          </div>
          <div className="col-span-1 min-h-[300px]">
            <AudienceInsightsCard
              activeProperty={activeProperty}
              period={period}
            />
          </div>
        </div>
      </section>

      {/* AI Analytics Insights Section - Full width */}
      <section className="space-y-4">
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <AIChatComponent 
              chatType="analytics"
              activeProperty={activeProperty}
              period={period}
          />
          </div>
        </div>
      </section>
    </div>
  );
}