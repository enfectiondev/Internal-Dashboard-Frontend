import React, { useState, useEffect } from "react";
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

export default function GoogleAnalytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/metrics/417333460?period=90d",
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500 mt-20">Loading metrics...</p>;
  }

  if (!metrics) {
    return <p className="text-center text-red-500 mt-20">Failed to load metrics.</p>;
  }

  return (
    <div>
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          subtitle={`Total Users Change: ${metrics.totalUsersChange}`}
        />
        <MetricCard
          title="Sessions"
          value={metrics.sessions.toLocaleString()}
          subtitle={`Sessions Per User: ${metrics.sessionsPerUser}`}
        />
        <MetricCard
          title="Engaged Sessions"
          value={metrics.engagedSessions.toLocaleString()}
          subtitle={`Engaged Percentage: ${metrics["engagedSessions Percentage"]}`}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${metrics.engagementRate.toFixed(2)}%`}
          subtitle={`Engagement Rate Status: ${metrics["engagement RateStatus"]}`}
        />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <MetricCard
          title="Pages Per Session"
          value={metrics.pagesPerSession}
          subtitle={`Content Depth Status: ${metrics.contentDepthStatus}`}
        />
        <MetricCard
          title="Avg. Session Duration (s)"
          value={metrics.averageSessionDuration.toFixed(2)}
          subtitle={`Session Duration Quality: ${metrics["sessionDuration Quality"]}`}
        />
        <MetricCard
          title="Bounce Rate"
          value={`${metrics.bounceRate.toFixed(2)}%`}
          subtitle={`Bounce Rate Status: ${metrics["bounce RateStatus"]}`}
        />
        <MetricCard
          title="Views Per Session"
          value={metrics.viewsPerSession}
          subtitle={`Session Quality Score: ${metrics.sessionQualityScore}`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-[65%_33.5%] gap-6 mt-6">
        <TrafficPerformanceBarChart />
        <TrafficBreakdownPie />
      </div>

      {/* Analytics Over Time */}
      <div className="mt-6">
        <AnalyticsOvertime />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-[33.5%_65%] gap-6 mt-6">
        <DevicePerformancePie />
        <UserEngagement />
      </div>

      {/* Funnel & ROAS */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <ROIAnalytics />
      </div>

      {/* Generated Insights */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <SummaryPanel />
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <GeographicalDetailsCard />
        <AudienceInsightsCard />
      </div>
    </div>
  );
}
