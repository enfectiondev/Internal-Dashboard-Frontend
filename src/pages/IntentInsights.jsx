import React, { useState } from "react";
import SeedKeywordsInput from "../components/SeedKeywordsInput";
import KeywordCards from "../components/KeywordCards";
import SuggestedKeywordsTable from "../components/SuggestedKeywordsTable";
import CountrySelector from "../components/CountrySelector";
import AccountSelector from "../components/AccountSelector";
import SearchesOverTimeChart from "../components/SearchesOverTimeChart";
import AIChatComponent from "../components/AIChatComponent";

export default function IntentInsights({ 
  period, 
  dateRange, 
  token, 
  selectedAccount, 
  onAccountSelect, 
  onAccountChange 
}) {
  const [selectedCountry, setSelectedCountry] = useState("World Wide earth");
  const [seedKeywords, setSeedKeywords] = useState([]);
  const [timeFrame, setTimeFrame] = useState("Monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);

  // Dummy data for keyword cards (fallback)
  const keywordData = [
    {
      keyword: "VIANA",
      searches: "1.45 K",
      competition: "Medium",
      isHighlighted: false
    },
    {
      keyword: "COSMATICS", 
      searches: "1.45 K",
      competition: "Medium",
      isHighlighted: false
    },
    {
      keyword: "TALC",
      searches: "1.45 K", 
      competition: "Medium",
      isHighlighted: false
    },
    {
      keyword: "CREAM",
      searches: "1.45 K",
      competition: "Medium", 
      isHighlighted: false
    },
    {
      keyword: "BEAUTY",
      searches: "1.45 K",
      competition: "Medium",
      isHighlighted: false
    }
  ];

  // Dummy data for suggested keywords table (fallback)
  const suggestedKeywords = [
    {
      keyword: "Viana lipstick",
      avgMonthlySearches: "23.4 K",
      competition: "Medium",
      competitionIndex: 3,
      lowBid: "$ 0.03",
      highBid: "$ 0.09"
    },
    {
      keyword: "hair treatments products", 
      avgMonthlySearches: "500",
      competition: "Low",
      competitionIndex: 6,
      lowBid: "$ 0.44",
      highBid: "$ 0.94"
    },
    {
      keyword: "makeup products",
      avgMonthlySearches: "5.4 K", 
      competition: "High",
      competitionIndex: 6,
      lowBid: "$ 0.55",
      highBid: "$ 0.87"
    },
    {
      keyword: "beauty products",
      avgMonthlySearches: "450",
      competition: "Low", 
      competitionIndex: 1,
      lowBid: "$ 0.03",
      highBid: "$ 0.08"
    }
  ];

  const handleAddKeyword = (keyword) => {
    if (keyword && !seedKeywords.includes(keyword)) {
      setSeedKeywords([...seedKeywords, keyword]);
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setSeedKeywords(seedKeywords.filter(k => k !== keyword));
  };


  // Convert period to date range
  const getDateRangeFromPeriod = () => {
    console.log("getDateRangeFromPeriod called with:", { dateRange, period });
    
    // ✅ Helper function to format Date object to YYYY-MM-DD
    const formatDateToString = (date) => {
      if (!date) return null;
      
      // If it's already a string in correct format, return it
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      
      // Convert to Date object if needed
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // ✅ Format using local timezone (avoid UTC conversion issues)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };
    
    // First check if we have custom dateRange from Layout (this takes priority)
    if (dateRange?.startDate && dateRange?.endDate) {
      console.log("Using custom dateRange:", dateRange);
      
      const formattedStart = formatDateToString(dateRange.startDate);
      const formattedEnd = formatDateToString(dateRange.endDate);
      
      console.log("Formatted dates:", { formattedStart, formattedEnd });
      
      return {
        startDate: formattedStart,
        endDate: formattedEnd
      };
    }

    console.log("Using period-based calculation for:", period);
    
    // If no custom dateRange, calculate from period
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    let startDate = new Date(today);

    switch (period) {
      case "LAST_7_DAYS":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "LAST_30_DAYS":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "LAST_3_MONTHS":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "LAST_1_YEAR":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30); // Default to 30 days
    }

    const formattedStart = formatDateToString(startDate);
    const formattedEnd = formatDateToString(endDate);
    
    console.log("Period-based dates:", { formattedStart, formattedEnd });

    return { 
      startDate: formattedStart, 
      endDate: formattedEnd 
    };
  };

    // Format numbers with K/M suffixes
    const formatNumber = (num) => {
        if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)} M`;
        } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)} K`;
        }
        return num.toString();
    };

    // Transform API data for KeywordCards
    const getKeywordCardsData = () => {
        if (!apiResponse?.historical_metrics_raw?.results) {
        return []; // Empty until API response
        }
        
        return apiResponse.historical_metrics_raw.results.map(result => ({
        keyword: result.keyword_text.toUpperCase(),
        searches: formatNumber(result.keyword_metrics.avg_monthly_searches),
        competition: result.keyword_metrics.competition || "Unknown",
        isHighlighted: false
        }));
    };


    const getSuggestedKeywordsData = () => {
        if (!apiResponse?.keyword_ideas_raw?.results) {
            return []; // Empty until API response
        }
        
        // Create a set of seed keywords (case-insensitive) for filtering
        const seedKeywordsSet = new Set(
            seedKeywords.map(keyword => keyword.toLowerCase().trim())
        );
        
        return apiResponse.keyword_ideas_raw.results
            .filter(result => {
            // Exclude keywords that match any of the seed keywords (case-insensitive)
            const keywordText = result.keyword_text.toLowerCase().trim();
            return !seedKeywordsSet.has(keywordText);
            })
            .map(result => ({
            keyword: result.keyword_text,
            // Store both formatted and raw values
            avgMonthlySearches: formatNumber(result.metrics.avg_monthly_searches),
            avgMonthlySearchesRaw: result.metrics.avg_monthly_searches, // Raw value for sorting
            competition: result.metrics.competition || "Unknown",
            competitionIndex: result.metrics.competition_index || 0,
            lowBid: `$ ${result.metrics.low_top_of_page_bid_dollars.toFixed(2)}`,
            lowBidRaw: result.metrics.low_top_of_page_bid_dollars, // Raw value for sorting
            highBid: `$ ${result.metrics.high_top_of_page_bid_dollars.toFixed(2)}`,
            highBidRaw: result.metrics.high_top_of_page_bid_dollars // Raw value for sorting
            }));
        };

    
  const handleSubmit = async () => {
    if (!selectedAccount || seedKeywords.length === 0) {
      setError("Please select an account and add at least one keyword");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const accountId = selectedAccount.id || selectedAccount.customerId;
      const { startDate, endDate } = getDateRangeFromPeriod();
      
      // ✅ startDate and endDate are already formatted as YYYY-MM-DD strings
      const requestBody = {
        seed_keywords: seedKeywords,
        country: selectedCountry === "World Wide earth" ? "World Wide" : selectedCountry,
        timeframe: "custom",
        start_date: startDate,  // ✅ Already formatted, don't convert again
        end_date: endDate,      // ✅ Already formatted, don't convert again
        include_zero_volume: true
      };

      console.log("Submitting with data:", {
        accountId,
        requestBody,
        headers: { 'Authorization': `Bearer ${token}` },
        period: period
      });

      const response = await fetch(
        `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/intent/keyword-insights/${accountId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
      console.log("API Response received:", data);
      
    } catch (error) {
      console.error("Error fetching keyword insights:", error);
      setError(`Failed to fetch keyword insights: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Show account selector if no account is selected
  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <AccountSelector 
          onAccountSelect={onAccountSelect} 
          token={token}
        />
      </div>
    );
  }

  // Show keyword research tools after account selection - back to original 3-column layout
  return (
    <div className="space-y-6">
      {/* Account Info Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Account: {selectedAccount.name || selectedAccount.descriptiveName || 'Unnamed Account'}
            </h3>
            <p className="text-sm text-gray-600">
              ID: {selectedAccount.id || selectedAccount.customerId} | {selectedAccount.description || selectedAccount.currencyCode || 'No description'}
            </p>
          </div>
          <button
            onClick={onAccountChange}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Change Account
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Header Controls - Back to original 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Seed Keywords Input - Takes 2 columns on large screens */}
        <div className="lg:col-span-2 h-full">
          <div className="h-full">
            <SeedKeywordsInput 
              keywords={seedKeywords}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              maxKeywords={10}
            />
          </div>
        </div>
        
        {/* Country Selector and Submit - Takes 1 column */}
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <CountrySelector 
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || seedKeywords.length === 0}
            className="w-full text-white font-bold py-3 px-6 rounded-lg transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: isLoading ? '#9CA3AF' : '#508995' }}
            onMouseEnter={(e) => {
              if (!isLoading && seedKeywords.length > 0) {
                e.target.style.backgroundColor = '#0E4854';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && seedKeywords.length > 0) {
                e.target.style.backgroundColor = '#508995';
              }
            }}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Results Section - Only show if we have API response */}
      {apiResponse ? (
        <>
          {/* Keyword Cards Section */}
          <div className="space-y-4">
            <KeywordCards 
              keywords={getKeywordCardsData()}
              timeFrame={timeFrame}
            />
          </div>

          {/* Suggested Keywords Table */}
          <div className="space-y-4">
            <SuggestedKeywordsTable 
              keywords={getSuggestedKeywordsData()}
            />
          </div>

          {/* Searches Over Time Chart */}
          <div className="space-y-4">
            <SearchesOverTimeChart 
              selectedAccount={selectedAccount}
              selectedCountry={selectedCountry}
              seedKeywords={seedKeywords}
              apiData={apiResponse}
            />
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready for Keyword Research
              </h3>
              <p className="text-gray-600">
                Add your seed keywords above and click Submit to get keyword insights, search volume data, and trend analysis.
              </p>
            </div>
          </div>
        </div>
      )}

    
      {/* AI Intent Insights Section - Full width */}
      <section className="space-y-4">
        <div className="grid grid-cols-1">
          <div className="col-span-1">
            <AIChatComponent 
              chatType="intent"
              selectedAccount={selectedAccount}
              period={period}
            />
          </div>
        </div>
      </section>
    </div>
  );
}