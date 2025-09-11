import React, { useState } from "react";

function SummaryPanel() {
  const [activeTab, setActiveTab] = useState("Summary");
  const [showSummary, setShowSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [availableTabs, setAvailableTabs] = useState([]);

  const getDummyData = () => {
    const dummyDataSets = [
      {
        tabs: ["Summary", "Recommendations"],
        content: {
          Summary: {
            sections: [
              {
                title: "Overall Performance Summary",
                items: [
                  "Your Google Ads account is managing 12 active campaigns with a total spend of $4,750 over the last 30 days.",
                  "Generated 6,234 clicks from 384,590 impressions, achieving an overall CTR of 1.62%.",
                  "Your campaigns delivered 189 conversions at an average cost per conversion of $25.13.",
                  'Top performing campaign "Beauty Essentials - Brand" generated 142 conversions with 4.8% CTR.',
                  "Mobile devices account for 78% of your total clicks, desktop 18%, and tablets 4%.",
                ],
              },
              {
                title: "Revenue & ROI Metrics",
                items: [
                  "Total revenue attributed to ads: $18,945 with 298% ROAS (Return on Ad Spend).",
                  "Average order value from paid traffic: $89.42, 23% higher than organic traffic.",
                  "Customer acquisition cost decreased by 18% compared to previous month.",
                  "Lifetime value of customers from ads shows 67% retention after 6 months.",
                ],
              },
              {
                title: "Additional Insights",
                items: [
                  "Consider testing new ad creatives for underperforming campaigns.",
                  "Focus on retargeting audiences who engaged but didn’t convert.",
                ],
              },
              {
                title: "Extra Recommendations",
                items: [
                  "Implement automated bid strategies for better ROAS.",
                  "Reallocate budget from low-performing display campaigns.",
                ],
              },
            ],
          },
          Recommendations: {
            sections: [
              {
                title: "Budget Reallocation Strategy",
                items: [
                  'Increase budget for "Beauty Essentials" campaign by 35% due to exceptional 298% ROAS.',
                  'Reduce spend on "Generic Beauty" campaign by 20% - underperforming with 1.2% CTR.',
                  "Shift $800 monthly budget from Display to Search campaigns for 40% better performance.",
                  "Implement dayparting: increase bids 25% during peak hours (2-4 PM, 7-9 PM).",
                ],
              },
            ],
          },
        },
      },
    ];
    return dummyDataSets[0];
  };

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const dummyData = getDummyData();
      setSummaryData(dummyData);
      setAvailableTabs(dummyData.tabs);
      setActiveTab(dummyData.tabs[0]);
      setShowSummary(true);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!summaryData || !summaryData.content[activeTab]) return null;
    const sections = summaryData.content[activeTab].sections;
    const isScrollable = sections.length > 3;

    return (
      <div
        className={
          isScrollable
            ? "max-h-[400px] overflow-y-auto pr-2 space-y-4"
            : "space-y-4"
        }
      >
        {sections.map((section, index) => (
          <div
            key={index}
            className="border border-[#1A4752] rounded-lg overflow-hidden bg-[#D9D9D9] border-l-4 shadow-md"
          >
            <div className="px-4 py-2 border-b border-gray-300">
              <h4 className="font-bold text-black text-[16px]">
                {section.title}
              </h4>
            </div>
            <ul className="p-4 space-y-1 text-black text-xs list-disc list-inside">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm min-h-[500px]">
      {!showSummary ? (
        <div className="flex justify-center items-center h-full ">
          <div
            className="p-2 rounded-lg border border-black"
            style={{ backgroundColor: "#75ACB8" }}
          >
            <button
              onClick={handleGenerateInsights}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-medium text-[#0E4A57] transition-all duration-200 w-full hover:shadow-lg"
              style={{
                background: "linear-gradient(180deg, #FAF5F5 0%, #47DBFF 100%)",
              }}
            >
              {/* AI badge */}
              <img
                src="/images/ai.png"
                alt="AI"
                className="w-7 h-7 object-contain"
              />

              {isLoading ? "Generating Insights..." : "Generate Insights"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex space-x-2 mb-4">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
                  activeTab === tab
                    ? "bg-[#D9D9D9] border border-b-0 border-gray-300 text-black"
                    : "bg-white border-black border-2 text-black rounded-lg hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {renderContent()}
        </>
      )}
    </div>
  );
}

export default SummaryPanel;
