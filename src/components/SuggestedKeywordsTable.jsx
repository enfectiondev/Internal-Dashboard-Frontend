import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";

export default function SuggestedKeywordsTable({ keywords = [] }) {
  const [downloading, setDownloading] = useState(false);

  // Always sort keywords by avgMonthlySearches (max → min)
  const sortedKeywords = useMemo(() => {
    return [...keywords].sort((a, b) => {
      const aNum = parseFloat(a.avgMonthlySearches.replace(/[^0-9.]/g, "")) || 0;
      const bNum = parseFloat(b.avgMonthlySearches.replace(/[^0-9.]/g, "")) || 0;
      return bNum - aNum; // descending
    });
  }, [keywords]);

  const getCompetitionColor = (competition) => {
    switch (competition?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const downloadCSV = () => {
    if (!keywords.length) {
      alert("No suggested keywords available to download");
      return;
    }

    try {
      setDownloading(true);

      const headers = [
        "Keyword",
        "Avg. Monthly Searches",
        "Competition",
        "Competition Index",
        "Low Bid",
        "High Bid",
      ];

      const csvData = sortedKeywords.map((k) => [
        `"${k.keyword}"`,
        k.avgMonthlySearches,
        k.competition,
        k.competitionIndex,
        k.lowBid,
        k.highBid,
      ]);

      const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "suggested_keywords.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download suggested keywords:", err);
      alert("Failed to download suggested keywords");
    } finally {
      setDownloading(false);
    }
  };

  if (!keywords.length) {
    return (
      <div className="w-full bg-white rounded-2xl p-2 shadow-sm">
        <div className="bg-white overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-gray-900">Suggested Keywords</h2>
          </div>
          <div className="text-center text-gray-500 py-8">
            No suggested keywords available. Submit your seed keywords to get suggestions.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl p-2 shadow-sm">
      <div className="bg-white overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Suggested Keywords</h2>
          <button
            onClick={downloadCSV}
            disabled={downloading || !keywords.length}
            className={`p-2 rounded transition-colors ${
              downloading || !keywords.length
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={downloading ? "Downloading..." : "Download CSV"}
          >
            <Download size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  Keyword
                </th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  Avg. Monthly Searches
                </th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  Competition
                </th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  Competition Index
                </th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  Low Bid
                </th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">
                  High Bid
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedKeywords.map((keyword, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-md text-black font-medium">
                    {keyword.keyword}
                  </td>
                  <td className="px-6 py-4 text-md text-black font-medium">
                    {keyword.avgMonthlySearches}
                  </td>
                  <td className="px-6 py-4 text-md font-medium">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCompetitionColor(
                        keyword.competition
                      )}`}
                    >
                      {keyword.competition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-md text-black font-medium">
                    {keyword.competitionIndex}
                  </td>
                  <td className="px-6 py-4 text-md text-black font-mono">
                    {keyword.lowBid}
                  </td>
                  <td className="px-6 py-4 text-md text-black font-mono">
                    {keyword.highBid}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="text-sm text-gray-500">
            Showing {sortedKeywords.length} suggested keywords
          </div>
        </div>
      </div>
    </div>
  );
}
