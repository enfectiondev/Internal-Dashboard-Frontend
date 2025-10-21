import React, { useState, useEffect, useRef } from "react";
import GoogleAds from "../pages/GoogleAds";
import GoogleAnalytics from "../pages/GoogleAnalytics";
import IntentInsights from "../pages/IntentInsights";
import FacebookAnalytics from "../pages/FacebookAnalytics";
import InstagramAnalytics from "../pages/InstagramAnalytics";
import MetaAds from "../pages/MetaAds";
import Reporting from "../pages/Reporting";
import DateRangePicker from "../components/DateRangePicker";
import ScrollableTabs from "../components/ScrollableTabs";
import { useCache } from "../context/CacheContext";
import { generateAndDownloadReport } from "../utils/PDFReportGenerator";

const tabs = [
  "Google Ads Campaigns",
  "Google Analytics",
  "Meta Ads",
  "Facebook",
  "Instagram",
  "Intent Insights",
  "Reporting"
];

export default function Layout({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("Google Ads Campaigns");
  const [activeCampaignIdx, setActiveCampaignIdx] = useState(0);
  const [activePropertyIdx, setActivePropertyIdx] = useState(0);
  const [activeFacebookIdx, setActiveFacebookIdx] = useState(0);
  const [activeInstagramIdx, setActiveInstagramIdx] = useState(0);
  const [activeMetaAdsIdx, setActiveMetaAdsIdx] = useState(0);
  const [period, setPeriod] = useState("LAST_7_DAYS");
  const [campaigns, setCampaigns] = useState([]);
  const [properties, setProperties] = useState([]);
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [instagramAccounts, setInstagramAccounts] = useState([]);
  const [metaAdsAccounts, setMetaAdsAccounts] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const [loadingMetaAds, setLoadingMetaAds] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  
  const [selectedIntentAccount, setSelectedIntentAccount] = useState(null);
  
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  });

  const token = localStorage.getItem("token");
  const cache = useCache();

  const periodOptions = [
    { value: "LAST_7_DAYS", label: "7 Days" },
    { value: "LAST_30_DAYS", label: "30 Days" },
    { value: "LAST_3_MONTHS", label: "3 Months" },
    { value: "LAST_1_YEAR", label: "1 Year" },
    { value: "CUSTOM", label: "Custom Range" }
  ];

  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  });

  const convertPeriodForAnalytics = (period) => {
    const periodMap = {
      'LAST_7_DAYS': '7d',
      'LAST_30_DAYS': '30d',
      'LAST_3_MONTHS': '90d',
      'LAST_1_YEAR': '365d',
      'CUSTOM': 'custom'  // GA4 uses lowercase 'custom'
    };
    return periodMap[period] || '30d';
  };

  const handlePeriodSelect = (periodValue) => {
    console.log('[Layout] Period selected:', periodValue); // ADD THIS LOG
    if (periodValue === "CUSTOM") {
      setShowCustomDatePicker(true);
      // Don't set period yet, wait for date submission
    } else {
      setShowCustomDatePicker(false);
      setCustomDates({ startDate: '', endDate: '' }); // ✅ CLEAR custom dates when selecting predefined period
      setPeriod(periodValue); // ✅ This should trigger re-render
      setIsDropdownOpen(false);
      console.log('[Layout] Period set to:', periodValue); // ADD THIS LOG
    }
  };

  

  const handleCustomDateSubmit = () => {
    if (customDates.startDate && customDates.endDate) {
      console.log('[Layout] Custom dates submitted:', customDates); // This log already exists
      console.log('[Layout] Setting period to CUSTOM'); // ADD THIS LOG
      setPeriod("CUSTOM");
      setIsDropdownOpen(false);
      setShowCustomDatePicker(false);
    } else {
      console.log('[Layout] ERROR: Missing dates', customDates); // ADD THIS LOG
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // In the Layout.jsx useEffect for campaigns
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
        console.log("📊 [Layout] API campaigns data:", data);
        
        // ✅ ENSURE customerId IS PROPERLY SET
        const formattedCampaigns = data.map(campaign => ({
          ...campaign,
          customerId: campaign.customerId || campaign.id,  // Fallback to id if customerId missing
          id: campaign.id || campaign.customerId
        }));
        
        console.log("📊 [Layout] Formatted campaigns:", formattedCampaigns);
        setCampaigns(formattedCampaigns);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, [token]);

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

  useEffect(() => {
    const fetchMetaAdsAccounts = async () => {
      const facebookToken = localStorage.getItem('facebook_token');
      if (!facebookToken) {
        setMetaAdsAccounts([]);
        setLoadingMetaAds(false);
        return;
      }

      setLoadingMetaAds(true);
      try {
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/ad-accounts",
          { headers: { Authorization: `Bearer ${facebookToken}` } }
        );
        
        if (!res.ok) {
          console.error("Failed to fetch Meta Ads accounts:", res.status);
          if (res.status === 401) {
            localStorage.removeItem('facebook_token');
          }
          setMetaAdsAccounts([]);
          return;
        }
        
        const data = await res.json();
        console.log("Meta Ads accounts data:", data);
        
        const formattedAccounts = data.map(account => ({
          id: account.id,
          account_id: account.account_id,
          name: account.name,
          status: account.status,
          currency: account.currency,
          timezone: account.timezone,
          amount_spent: account.amount_spent,
          balance: account.balance
        }));
        
        setMetaAdsAccounts(formattedAccounts);
      } catch (err) {
        console.error("Error fetching Meta Ads accounts:", err);
        setMetaAdsAccounts([]);
      } finally {
        setLoadingMetaAds(false);
      }
    };

    fetchMetaAdsAccounts();
  }, []);



  useEffect(() => {
    const fetchFacebookAccounts = async () => {
      const facebookToken = localStorage.getItem('facebook_token');
      if (!facebookToken) {
        setFacebookAccounts([]);
        setLoadingFacebook(false);
        return;
      }

      setLoadingFacebook(true);
      try {
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/meta/pages",
          { headers: { Authorization: `Bearer ${facebookToken}` } }
        );
        
        if (!res.ok) {
          console.error("Failed to fetch Facebook pages:", res.status);
          if (res.status === 401) {
            localStorage.removeItem('facebook_token');
          }
          setFacebookAccounts([]);
          return;
        }
        
        const data = await res.json();
        console.log("Facebook pages data:", data);
        
        const formattedPages = data.map(page => ({
          id: page.id,
          name: page.name,
          category: page.category || 'Page',
          type: 'page'
        }));
        
        setFacebookAccounts(formattedPages);
      } catch (err) {
        console.error("Error fetching Facebook pages:", err);
        setFacebookAccounts([]);
      } finally {
        setLoadingFacebook(false);
      }
    };

    fetchFacebookAccounts();
  }, []);

  useEffect(() => {
      const shouldSwitchToInstagram = localStorage.getItem('switch_to_instagram_tab');
      if (shouldSwitchToInstagram === 'true') {
        setActiveTab('Instagram');
        setPeriod('LAST_30_DAYS');
        localStorage.removeItem('switch_to_instagram_tab');
      }
    }, []);

    // Update the existing Facebook switch effect
    useEffect(() => {
      const shouldSwitchToFacebook = localStorage.getItem('switch_to_facebook_tab');
      if (shouldSwitchToFacebook === 'true') {
        setActiveTab('Facebook');
        setPeriod('LAST_30_DAYS'); // Set to 30 days like Meta Ads
        localStorage.removeItem('switch_to_facebook_tab');
      }
    }, []);

  useEffect(() => {
    const shouldSwitchToMetaAds = localStorage.getItem('switch_to_meta_ads_tab');
    if (shouldSwitchToMetaAds === 'true') {
      setActiveTab('Meta Ads');
      setPeriod('LAST_30_DAYS'); // Set to 30 days
      localStorage.removeItem('switch_to_meta_ads_tab');
    }
  }, []);

  // Auto-select first Meta account when accounts load
  useEffect(() => {
    if (activeTab === "Meta Ads" && metaAdsAccounts.length > 0 && activeMetaAdsIdx === 0) {
      // First account is already selected by default, just trigger data fetch
      console.log("Auto-selected first Meta Ads account:", metaAdsAccounts[0]);
    }
  }, [metaAdsAccounts, activeTab]);


  useEffect(() => {
    const fetchInstagramAccounts = async () => {
      setInstagramAccounts([]);
      setLoadingInstagram(false);
    };

    fetchInstagramAccounts();
  }, [token]);

  useEffect(() => {
    const fetchMetaAdsAccounts = async () => {
      setMetaAdsAccounts([]);
      setLoadingMetaAds(false);
    };

    fetchMetaAdsAccounts();
  }, [token]);

  const handleLogout = () => {
    cache.clearCache();
    setSelectedIntentAccount(null);
    onLogout();
  };

  const handleDateRangeChange = (startDate, endDate) => {
    console.log('[Layout] Date range changed:', { startDate, endDate });
    
    // ✅ Store as Date objects
    setDateRange({ 
      startDate: startDate, 
      endDate: endDate 
    });
  };

  // const handlePeriodSelect = (periodValue) => {
  //   setPeriod(periodValue);
  //   setIsDropdownOpen(false);
  // };

  const handleIntentAccountSelect = (account) => {
    setSelectedIntentAccount(account);
    console.log("Intent account selected:", account);
  };

  const handleIntentAccountChange = () => {
    setSelectedIntentAccount(null);
  };

  const handlePageNavigation = (page) => {
    const baseUrl = "https://eyqi6vd53z.us-east-2.awsapprunner.com";
    const url = `${baseUrl}/${page}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsProfileDropdownOpen(false);
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      console.log("Starting PDF generation...");
      
      const cacheStats = cache.getCacheStats();
      console.log("Cache stats before PDF generation:", cacheStats);
      console.log("Full cache object:", cache);
      
      if (cacheStats.totalKeys === 0) {
        alert("No data found in cache. Please navigate through the dashboard tabs to load data first, then try downloading the report again.");
        return;
      }
      
      const result = await generateAndDownloadReport(cache, user);
      
      if (result.success) {
        console.log(`PDF report downloaded successfully: ${result.filename}`);
      } else {
        console.error("Failed to generate PDF report:", result.error);
        alert(`Failed to generate report: ${result.error}`);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("An error occurred while generating the report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getCurrentPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === period);
    return option ? option.label : "7 Days";
  };

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
      } else if (activeTab === "Facebook") {
        return {
          items: facebookAccounts,
          loading: loadingFacebook,
          activeIndex: activeFacebookIdx,
          setActiveIndex: setActiveFacebookIdx,
          type: 'facebook'
        };
      } else if (activeTab === "Instagram") {
        return {
          items: [],
          loading: false,
          activeIndex: 0,
          setActiveIndex: () => {},
          type: 'instagram'
        };
      } else if (activeTab === "Meta Ads") {
        return {
          items: metaAdsAccounts,
          loading: loadingMetaAds,
          activeIndex: activeMetaAdsIdx,
          setActiveIndex: setActiveMetaAdsIdx,
          type: 'metaads'
        };
      } else if (activeTab === "Intent Insights") {
        return {
          items: [],
          loading: false,
          activeIndex: 0,
          setActiveIndex: () => {},
          type: 'insights'
        };
      } else if (activeTab === "Reporting") {
        return {
          items: [],
          loading: false,
          activeIndex: 0,
          setActiveIndex: () => {},
          type: 'reporting'
        };
      }
      return { items: [], loading: false, activeIndex: 0, setActiveIndex: () => {}, type: 'unknown' };
    };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "Google Ads Campaigns") {
      setActiveCampaignIdx(0);
    } else if (tab === "Google Analytics") {
      setActivePropertyIdx(0);
    } else if (tab === "Facebook") {
      setActiveFacebookIdx(0);
    } else if (tab === "Instagram") {
      setActiveInstagramIdx(0);
    } else if (tab === "Meta Ads") {
      setActiveMetaAdsIdx(0);
    }
  };

  const renderContent = () => {
    const currentData = getCurrentData();
    
    if (activeTab === "Intent Insights") {
      return (
        <IntentInsights 
          period={period} 
          dateRange={dateRange} 
          token={token}
          selectedAccount={selectedIntentAccount}
          onAccountSelect={handleIntentAccountSelect}
          onAccountChange={handleIntentAccountChange}
        />
      );
    }

    if (activeTab === "Facebook") {
      return (
        <FacebookAnalytics 
          period={getCurrentPeriodLabel()}
          customDates={period === "CUSTOM" ? {
            startDate: customDates.startDate,
            endDate: customDates.endDate
          } : null}
        />
      );
    }

    if (activeTab === "Instagram") {
      return (
        <InstagramAnalytics 
          period={getCurrentPeriodLabel()}
          customDates={period === "CUSTOM" ? customDates : null}  // ADD THIS LINE
        />
      );
    }

    if (activeTab === "Meta Ads") {
      return (
        <MetaAds 
          period={period}
          customDates={period === "CUSTOM" ? {
            startDate: customDates.startDate,
            endDate: customDates.endDate
          } : null}
          selectedAccount={metaAdsAccounts[activeMetaAdsIdx]}
        />
      );
    }

    if (activeTab === "Reporting") {
      return (
        <Reporting 
          period={getCurrentPeriodLabel()}
          customDates={period === "CUSTOM" ? customDates : null}  // ADD THIS LINE
        />
      );
    }
    
    if (currentData.loading) {
      return <div className="text-white p-4">Loading {activeTab.toLowerCase()}...</div>;
    }
    
    if (!currentData.items.length && activeTab !== "Intent Insights" && activeTab !== "Facebook" && activeTab !== "Instagram" && activeTab !== "Meta Ads" && activeTab !== "Reporting") {
      return (
        <div className="text-white p-4">
          No {currentData.type} related to your {activeTab === "Facebook" || activeTab === "Instagram" || activeTab === "Meta Ads" ? activeTab : "Google"} account
        </div>
      );
    }

    switch (activeTab) {
      case "Google Ads Campaigns":
        return (
          <GoogleAds 
            activeCampaign={campaigns[activeCampaignIdx]} 
            period={period}
            customDates={period === "CUSTOM" ? {
              startDate: customDates.startDate,
              endDate: customDates.endDate
            } : null}
          />
        );
      case "Google Analytics":
        return (
          <GoogleAnalytics 
            activeProperty={properties[activePropertyIdx]} 
            period={convertPeriodForAnalytics(period)}
            customDates={period === "CUSTOM" ? {
              startDate: customDates.startDate,
              endDate: customDates.endDate
            } : null}
          />
        );
      default:
        return <div className="text-white p-4">Content for {activeTab}</div>;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B4E5D] via-[#05242A] to-[#1E1E1E] text-white overflow-x-hidden">
      <header className="backdrop-blur-sm p-4 flex items-center justify-between border-b border-white relative z-[9999]">
        <h1 className="text-2xl md:text-4xl font-normal text-[#A1BCD3]">ANALYTICS DASHBOARD</h1>
          <div className="flex items-center space-x-3">
            <span className="text-sm md:text-base text-white">{user?.name}</span>
            
            <div className="relative z-[9999]" ref={profileDropdownRef}>
              <div 
                className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden border-2 border-white"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-teal-800 font-semibold text-sm md:text-base">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[160px] z-[9999]">
                  <div className="py-2">
                    <button
                      onClick={() => handlePageNavigation('privacy')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Privacy Policy
                    </button>
                    <button
                      onClick={() => handlePageNavigation('terms')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Terms of Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] max-w-full">
        {activeTab !== "Intent Insights" && (
          <aside className="w-full md:w-[280px] bg-[#0e4652] pt-6 md:pt-24 pl-4 pr-4 flex flex-col flex-shrink-0">
            <div className="space-y-4 flex-1">
              {currentData.loading ? (
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
                        {activeTab === "Google Analytics" ? `Property: ${item.id}` : 
                        activeTab === "Facebook" ? `${item.category || 'Page'}` :
                        activeTab === "Instagram" ? `Account: ${item.id}` : 
                        activeTab === "Meta Ads" ? `${item.account_id} | ${item.currency}` :
                        item.id}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-white/70 p-4 text-sm md:text-base">
                  {activeTab === "Facebook" ? 
                    "Connect your Facebook account to get started" : 
                    activeTab === "Instagram" ? 
                    "Instagram integration coming soon" :
                    activeTab === "Meta Ads" ?
                    "Connect your Meta Ads account to get started" :
                    activeTab === "Reporting" ?
                    "Reporting features coming soon" :
                    `No ${currentData.type} related to your Google account`
                  }
                </div>
              )}
            </div>

            <div className="space-y-2 mt-4 md:mt-8 mb-4 md:mb-8">
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className={`w-full p-2 md:p-3 rounded text-sm md:text-base transition-colors ${
                  isDownloading 
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                {isDownloading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Download Full Report"
                )}
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

        <div className={`flex-1 bg-[#0F4653] p-4 md:p-6 min-w-0 ${activeTab === "Intent Insights" ? "w-full" : ""}`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 md:mb-6 gap-3 max-w-full">
            <div className="flex-1 min-w-0 w-full lg:w-auto">
              <ScrollableTabs 
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {activeTab === "Intent Insights" ? (
              <div className="flex items-center space-x-2 flex-shrink-0">
                <span className="text-sm md:text-base text-white whitespace-nowrap">Period:</span>
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onDateRangeChange={handleDateRangeChange}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-[#196473] px-3 md:px-4 py-1 md:py-2 rounded-3xl text-white flex-shrink-0">
                <span className="text-sm md:text-base whitespace-nowrap">Period:</span>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 bg-[#196473] text-white p-1 md:p-2 rounded text-sm md:text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[80px]"
                  >
                    <span>{getCurrentPeriodLabel()}</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[280px] z-50">
                    {periodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handlePeriodSelect(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg ${
                          option.value === "CUSTOM" ? '' : 'last:rounded-b-lg'
                        } transition-colors ${
                          period === option.value 
                            ? 'bg-[#508995] text-white hover:bg-[#508995]' 
                            : 'text-gray-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                    
                    {showCustomDatePicker && (
                      <div className="p-4 border-t border-gray-200 space-y-3 bg-white">
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">Start Date</label>
                          <input
                            type="date"
                            value={customDates.startDate}
                            onChange={(e) => setCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded focus:ring-2 focus:ring-[#1A4752] focus:border-transparent"
                            style={{ colorScheme: 'light' }}
                          />
                          <span className="text-xs text-gray-500 mt-1 block">Format: YYYY-MM-DD</span>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 block mb-1">End Date</label>
                          <input
                            type="date"
                            value={customDates.endDate}
                            onChange={(e) => setCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded focus:ring-2 focus:ring-[#1A4752] focus:border-transparent"
                            style={{ colorScheme: 'light' }}
                          />
                          <span className="text-xs text-gray-500 mt-1 block">Format: YYYY-MM-DD</span>
                        </div>
                        <button
                          onClick={handleCustomDateSubmit}
                          disabled={!customDates.startDate || !customDates.endDate}
                          className="w-full px-4 py-2 bg-[#508995] text-white rounded hover:bg-[#3F7380] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Apply Custom Range
                        </button>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>

          {activeTab === "Intent Insights" && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleDownloadReport}
                disabled={isDownloading}
                className={`px-6 py-2 rounded text-sm transition-colors ${
                  isDownloading 
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
                    : "bg-teal-600 text-white hover:bg-teal-700"
                }`}
              >
                {isDownloading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Download Full Report"
                )}
              </button>
            </div>
          )}

          <div className="bg-[#1A6473] p-4 md:p-6 rounded-lg">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}