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

// ROIAnalytics Component
const ROIAnalytics = ({ propertyId, adsCustomerIds }) => {
  const [chartData, setChartData] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showAdspend, setShowAdspend] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch matrix metrics
        const matrixRes = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/combined/roas-roi-metrics?ga_property_id=${propertyId}&ads_customer_ids=${adsCustomerIds}&period=30d`
        );
        const matrixJson = await matrixRes.json();
        setMatrixData(matrixJson[0]);

        // Fetch revenue timeseries
        const revenueRes = await fetch(
          `http://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/time-series/${propertyId}?metric=totalRevenue&period=7d`
        );
        const revenueJson = await revenueRes.json();

        // Fetch adspend timeseries
        const adspendRes = await fetch(
          `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/channel-revenue-timeseries/${propertyId}?period=7d`
        );
        const adspendJson = await adspendRes.json();

        // Combine revenue & adspend by date
        const combinedData = revenueJson.map((item, index) => ({
          date: item.date,
          revenue: item.value,
          adspend: adspendJson?.values?.[index] || 0,
        }));

        setChartData(combinedData);
      } catch (err) {
        console.error("Failed to fetch ROIAnalytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, adsCustomerIds]);

  const CustomLineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow text-sm text-gray-800 border border-gray-200">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="flex items-center">
              <span
                className="w-3 h-3 mr-1 rounded-sm"
                style={{ backgroundColor: entry.stroke }}
              ></span>
              {entry.name}: ${entry.value.toLocaleString()}
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

  if (loading || !matrixData) return <p className="text-center mt-10">Loading ROI Analytics...</p>;

  const labelBaseStyle = {
    cursor: "pointer",
    transition: "color 0.2s, text-decoration 0.2s",
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-black">ROAS & ROI Analytics</h3>
        <div className="flex items-center text-sm">
          <div
            className="flex items-center mr-4 select-none cursor-pointer"
            onClick={() => setShowRevenue((prev) => !prev)}
          >
            <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: showRevenue ? "#374151" : "#ccc" }}></div>
            <span style={{ ...labelBaseStyle, color: showRevenue ? "#000" : "#888", textDecoration: showRevenue ? "none" : "line-through" }}>Revenue</span>
          </div>
          <div
            className="flex items-center select-none cursor-pointer"
            onClick={() => setShowAdspend((prev) => !prev)}
          >
            <div className="w-3 h-3 mr-1 rounded" style={{ backgroundColor: showAdspend ? "#22D3EE" : "#ccc" }}></div>
            <span style={{ ...labelBaseStyle, color: showAdspend ? "#000" : "#888", textDecoration: showAdspend ? "none" : "line-through" }}>Adspend</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <hr className="mb-4" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#000" }} axisLine={{ stroke: "#000" }} tickLine={{ stroke: "#000" }} />
                <YAxis tick={{ fontSize: 12, fill: "#000" }} axisLine={{ stroke: "#000" }} tickLine={{ stroke: "#000" }} />
                <Tooltip content={<CustomLineTooltip />} />
                {showRevenue && <Line type="monotone" dataKey="revenue" stroke="#374151" strokeWidth={3} dot={false} name="Revenue" />}
                {showAdspend && <Line type="monotone" dataKey="adspend" stroke="#22D3EE" strokeWidth={3} dot={false} name="Adspend" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="ROI" value={`${matrixData.roi}%`} bgColor="#B4B4B4" />
            <MetricCard label="ROAS" value={matrixData.roas} bgColor="#B4B4B4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Total Revenue" value={`$${matrixData.totalRevenue.toLocaleString()}`} bgColor="#B4B4B4" />
            <MetricCard label="Total Adspend" value={`$${matrixData.adSpend.toLocaleString()}`} bgColor="#B4B4B4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Revenue Per User" value={`$${matrixData.revenuePerUser}`} bgColor="#B4B4B4" />
            <MetricCard label="Total Purchasers" value={matrixData.totalPurchasers.toLocaleString()} bgColor="#B4B4B4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Active Users" value={matrixData.activeUsers.toLocaleString()} bgColor="#B4B4B4" />
            <MetricCard label="Avg. Purchase /A.U" value={matrixData.averagePurchaseRevenuePerActiveUser} bgColor="#B4B4B4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Layout Component with Campaign Dropdown
export default function Layout() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(
          "http://eyqi6vd53z.us-east-2.awsapprunner.com/api/combined/roas-roi-metrics?ga_property_id=453831024&ads_customer_ids=3220426249&period=30d"
        );
        const data = await res.json();
        setCampaigns(data);
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (loadingCampaigns) return <p className="text-center mt-10">Loading campaigns...</p>;

  return (
    <div className="bg-white rounded-xl">
      {!selectedCampaign && (
        <div className="min-h-screen flex flex-col justify-center items-center p-2">
          <div className="relative w-lg mb-8 p-2 rounded-lg border border-[#0E4A57] bg-[#75ACB8]">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full text-[#0E4A57] px-6 py-2 rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all font-bold"
              style={{ background: "linear-gradient(180deg, #FAF5F5 0%, #47DBFF 100%)" }}
            >
              <span className="mb-1">Select the Ad Campaign Account</span>
              <AiOutlineCaretDown className={`transition-transform ${showDropdown ? "rotate-180" : ""}`} size={24} />
            </button>

            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setShowDropdown(false);
                      }}
                      className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 text-lg">{campaign.name}</div>
                          <div className="text-sm text-gray-500 mt-1">ID: {campaign.id}</div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml-2">
                          {campaign.time_zone}
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

      {selectedCampaign && (
        <div className="bg-white p-6 rounded-lg shadow-lg w-full">
          <ROIAnalytics
            propertyId={selectedCampaign.id} // using campaign id for propertyId
            adsCustomerIds={selectedCampaign.id} // using campaign id
          />
        </div>
      )}
    </div>
  );
}
