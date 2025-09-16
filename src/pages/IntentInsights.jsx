import React, { useState } from "react";
import SeedKeywordsInput from "../components/SeedKeywordsInput";
import KeywordCards from "../components/KeywordCards";
import SuggestedKeywordsTable from "../components/SuggestedKeywordsTable";
import CountrySelector from "../components/CountrySelector";
import AccountSelector from "../components/AccountSelector";
import SearchesOverTimeChart from "../components/SearchesOverTimeChart";

export default function IntentInsights({ 
  period, 
  dateRange, 
  token, 
  selectedAccount, 
  onAccountSelect, 
  onAccountChange 
}) {
  const [selectedCountry, setSelectedCountry] = useState("World Wide earth");
  const [seedKeywords, setSeedKeywords] = useState(["Viana", "Cosmatics", "Talc"]);
  const [timeFrame, setTimeFrame] = useState("Monthly");

  // Dummy data for keyword cards
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

  // Dummy data for suggested keywords table
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

  const handleSubmit = () => {
    console.log("Submitting with keywords:", seedKeywords, "Country:", selectedCountry, "Account:", selectedAccount);
    // Add API call logic here
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

  // Show keyword research tools after account selection - using exact existing layout
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

      {/* Header Controls */}
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
            className="w-full text-white font-bold py-3 px-6 rounded-lg transition-colors mt-4"
            style={{ backgroundColor: '#508995' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0E4854'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#508995'}
          >
            Submit
          </button>
        </div>
      </div>

      {/* Keyword Cards Section */}
      <div className="space-y-4">
        <KeywordCards 
          keywords={keywordData}
          timeFrame={timeFrame}
        />
      </div>

      {/* Suggested Keywords Table */}
      <div className="space-y-4">
        <SuggestedKeywordsTable 
          keywords={suggestedKeywords}
        />
      </div>

      {/* Searches Over Time Chart */}
      <div className="space-y-4">
        <SearchesOverTimeChart 
          selectedAccount={selectedAccount}
          selectedCountry={selectedCountry}
          seedKeywords={seedKeywords}
        />
      </div>
    </div>
  );
}