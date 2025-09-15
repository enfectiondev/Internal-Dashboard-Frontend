import React, { useState, useEffect } from "react";
import GoogleAds from "../pages/GoogleAds";
import GoogleAnalytics from "../pages/GoogleAnalytics";
import IntentInsights from "../pages/IntentInsights"; // Add this import
import { useCache } from "../context/CacheContext";

const tabs = ["Google Ads Campaigns", "Google Analytics", "Intent Insights"];

export default function Layout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("Google Ads Campaigns");
  const [activeCampaignIdx, setActiveCampaignIdx] = useState(0);
  const [activePropertyIdx, setActivePropertyIdx] = useState(0);
  const [period, setPeriod] = useState("LAST_7_DAYS");
  const [campaigns, setCampaigns] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);

  const token = localStorage.getItem("token");
  const { clearCache } = useCache();

  // Fetch campaigns for Google Ads
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/customers",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          console.error("Failed to fetch campaigns:", res.status);
          setCampaigns([]);
          setLoadingCampaigns(false);
          return;
        }

        const data = await res.json();
        console.log("API campaigns data:", data);
        setCampaigns(data);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [token]);

  // Fetch properties for Google Analytics
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/properties",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) {
          console.error("Failed to fetch properties:", res.status);
          setProperties([]);
          setLoadingProperties(false);
          return;
        }

        const data = await res.json();
        console.log("API properties data:", data);
        // Convert to match expected structure
        const formattedProperties = data.map(prop => ({
          id: prop.propertyId,
          name: prop.displayName,
          websiteUrl: prop.websiteUrl
        }));
        setProperties(formattedProperties);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setProperties([]);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [token]);

  const handleLogout = () => {
    clearCache(); // Clear cache before logout
    onLogout();
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    if (activeTab === "Google Ads Campaigns") {
      return {
        items: campaigns,
        loading: loadingCampaigns,
        activeIndex: activeCampaignIdx,
        setActiveIndex: setActiveCampaignIdx,
        type: 'campaigns'
      };
    } else if (activeTab === "Google Analytics") {
      return {
        items: properties,
        loading: loadingProperties,
        activeIndex: activePropertyIdx,
        setActiveIndex: setActivePropertyIdx,
        type: 'properties'
      };
    } else if (activeTab === "Intent Insights") {
      // Intent Insights doesn't need campaigns or properties selection
      return {
        items: [],
        loading: false,
        activeIndex: 0,
        setActiveIndex: () => {},
        type: 'insights'
      };
    }
    return { items: [], loading: false, activeIndex: 0, setActiveIndex: () => {}, type: 'unknown' };
  };

  const renderContent = () => {
    const currentData = getCurrentData();
    
    if (activeTab === "Intent Insights") {
      return <IntentInsights period={period} />;
    }
    
    if (currentData.loading) {
      return <div className="text-white p-4">Loading {activeTab.toLowerCase()}...</div>;
    }
    
    if (!currentData.items.length && activeTab !== "Intent Insights") {
      return (
        <div className="text-white p-4">
          No {currentData.type} related to your Google account
        </div>
      );
    }

    switch (activeTab) {
      case "Google Ads Campaigns":
        return (
          <GoogleAds 
            activeCampaign={campaigns[activeCampaignIdx]} 
            period={period}
          />
        );
      case "Google Analytics":
        return (
          <GoogleAnalytics 
            activeProperty={properties[activePropertyIdx]} 
            period={period}
          />
        );
      default:
        return <div className="text-white p-4">Content for {activeTab}</div>;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4E5D] via-[#05242A] to-[#1E1E1E] text-white">
      {/* Header */}
      <header className="backdrop-blur-sm p-4 flex items-center justify-between border-b border-white">
        <h1 className="text-2xl md:text-4xl font-normal text-[#A1BCD3]">ANALYTICS DASHBOARD</h1>
        <div className="flex items-center space-x-3">
          <span className="text-sm md:text-base text-white">{user?.name}</span>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-teal-800 font-semibold text-sm md:text-base">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Sidebar - Hide for Intent Insights */}
        {activeTab !== "Intent Insights" && (
          <aside className="w-full md:w-[280px] bg-[#1A4752] pt-6 md:pt-24 pl-4 flex flex-col">
          <div className="space-y-4 flex-1">
            {/* Only show items for Google Ads and Analytics tabs */}
            {activeTab === "Intent Insights" ? (
              <div className="text-white/70 p-4 text-sm md:text-base">
                Intent Insights - Keyword Research Tools
              </div>
            ) : currentData.loading ? (
              <div className="text-white p-4">
                Loading {currentData.type}...
              </div>
            ) : currentData.items.length > 0 ? (
              currentData.items.map((item, idx) => {
                const isActive = idx === currentData.activeIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => currentData.setActiveIndex(idx)}
                    className={`p-3 md:p-4 text-sm md:text-base cursor-pointer transition-colors rounded-lg ${
                      isActive
                        ? "bg-[#508995] text-black font-bold"
                        : "bg-white text-black hover:bg-[#508995] hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-lg md:text-xl">{item.name}</div>
                    <div className="text-xs md:text-sm opacity-75 mt-1">
                      {activeTab === "Google Analytics" ? `Property: ${item.id}` : item.id}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-white/70 p-4 text-sm md:text-base">
                No {currentData.type} related to your Google account
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4 md:mt-8 mb-4 md:mb-8 mr-4">
            <button
              className="w-full bg-teal-600 text-white p-2 md:p-3 rounded text-sm md:text-base hover:bg-teal-700"
              disabled={activeTab !== "Intent Insights" && currentData.items.length === 0}
            >
              Download Full Report
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 text-white p-2 md:p-3 rounded text-sm md:text-base hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </aside>
        )}

        {/* Main Section - Full width for Intent Insights */}
        <div className={`flex-1 bg-[#0F4653] p-4 md:p-6 ${activeTab === "Intent Insights" ? "w-full" : ""}`}>
          {/* Tabs & Period Selector */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6">
            {/* Tabs */}
            <div className="flex flex-wrap md:flex-nowrap space-x-0 md:space-x-4 mb-2 md:mb-0 w-full md:w-auto">
              {tabs.map((tab) => {
                const isActive = tab === activeTab;
                return (
                  <div
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      // Reset active index when switching tabs
                      if (tab === "Google Ads Campaigns") {
                        setActiveCampaignIdx(0);
                      } else if (tab === "Google Analytics") {
                        setActivePropertyIdx(0);
                      }
                    }}
                    className={`flex-1 md:flex-none md:min-w-[200px] px-4 md:px-8 py-2 md:py-4 text-sm md:text-base text-center cursor-pointer transition-colors rounded-lg ${
                      isActive
                        ? "bg-[#508995] text-black font-bold"
                        : "bg-[#0F4653] text-white font-bold hover:bg-white hover:text-black"
                    }`}
                  >
                    {tab}
                  </div>
                );
              })}
            </div>

            {/* Period Selector - Hide for Intent Insights */}
            {activeTab !== "Intent Insights" && (
              <div className="flex items-center space-x-2 bg-[#6A6A6A] px-3 md:px-4 py-1 md:py-2 rounded-3xl text-white">
                <span className="text-sm md:text-base">Period:</span>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-[#6A6A6A] text-white p-1 md:p-2 rounded text-sm md:text-base"
                >
                  <option value="LAST_7_DAYS">7 Days</option>
                  <option value="LAST_30_DAYS">30 Days</option>
                  <option value="LAST_3_MONTHS">3 Months</option>
                  <option value="LAST_1_YEAR">1 Year</option>
                </select>
              </div>
            )}
          </div>

          {/* Page Content */}
          <div className="bg-[#1A6473] p-4 md:p-6 rounded-lg">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}