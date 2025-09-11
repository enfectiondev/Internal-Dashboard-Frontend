import React, { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard";
import CampaignMetrics from "../components/CampaignMetrics";
import DevicePieChart from "../components/DevicePieChart";
import LineChartComp from "../components/LineChart";
import KeywordTable from "../components/KeywordTable";
import SummaryPanel from "../components/SummaryPanel";
import PieChartPerformance from "../components/PieChartPerformance";
import CampaignPerformanceDetails from "../components/CampaignPerformanceDetails";

export default function GoogleAds({ activeCampaign, period }) {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!activeCampaign?.id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/key-stats/${activeCampaign.id}?period=${period}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );

        if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
        const json = await res.json();

        setMetrics({
          impressions: json.total_impressions?.formatted || "-",
          cost: json.total_cost?.formatted || "-",
          clicks: json.total_clicks?.formatted || "-",
          conversionRate: json.conversion_rate?.formatted || "-",
          conversions: json.total_conversions?.formatted || "-",
          cpc: json.avg_cost_per_click?.formatted || "-",
          costPerConv: json.cost_per_conversion?.formatted || "-",
          ctr: json.click_through_rate?.formatted || "-",
        });
      } catch (err) {
        console.error("Failed to fetch campaign metrics:", err);
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [activeCampaign, period]);

  if (loading) return <p>Loading campaign metrics...</p>;

  return (
    <>
      {/* Metrics Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard title="Total Impressions" value={metrics.impressions} />
        <MetricCard title="Total Cost" value={metrics.cost} />
        <MetricCard title="Total Clicks" value={metrics.clicks} />
        <MetricCard title="Conversion Rate" value={metrics.conversionRate} />
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <MetricCard title="Total Conversions" value={metrics.conversions} />
        <MetricCard title="Avg. Cost Per Click" value={metrics.cpc} />
        <MetricCard title="Cost Per Conv." value={metrics.costPerConv} />
        <MetricCard title="Click-Through Rate" value={metrics.ctr} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-[65%_33.5%] gap-6 mt-6">
        <CampaignMetrics campaignId={activeCampaign?.id} />
        <DevicePieChart campaignId={activeCampaign?.id} />
      </div>

      {/* Performance Over Time */}
      <div className="mt-6">
        <LineChartComp campaign={activeCampaign} period={period} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-[33.5%_65%] gap-6 mt-6">
        <PieChartPerformance campaignId={activeCampaign?.id} />
        <CampaignPerformanceDetails campaignId={activeCampaign?.id} />
      </div>

      {/* Keywords & Summary */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <KeywordTable campaign={activeCampaign} />
        <SummaryPanel campaign={activeCampaign} />
      </div>
    </>
  );
}
