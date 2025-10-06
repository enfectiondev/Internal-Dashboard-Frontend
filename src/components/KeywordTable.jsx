import React, { useState } from "react";
import { Download } from "lucide-react";
import { useApiWithCache } from "../hooks/useApiWithCache";

function KeywordTable({ activeCampaign, period, customDates }) {
  const [showAll, setShowAll] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const convertPeriodForAPI = (period) => {
    const periodMap = {
      'LAST_7_DAYS': 'LAST_7_DAYS',
      'LAST_30_DAYS': 'LAST_30_DAYS',
      'LAST_3_MONTHS': 'LAST_90_DAYS',
      'LAST_1_YEAR': 'LAST_365_DAYS',
      'CUSTOM': 'CUSTOM'
    };
    return periodMap[period] || period;
  };

  const keywordsApiCall = async (customerId, cacheKeyOrPeriod) => {
    const token = localStorage.getItem("token");
    const actualPeriod = cacheKeyOrPeriod.startsWith('CUSTOM-') ? 'CUSTOM' : cacheKeyOrPeriod;
    const convertedPeriod = convertPeriodForAPI(actualPeriod);

    let url = `https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/keywords/${customerId}?period=${convertedPeriod}&offset=0&limit=100`;
    
    if (convertedPeriod === 'CUSTOM' && customDates?.startDate && customDates?.endDate) {
      url += `&start_date=${customDates.startDate}&end_date=${customDates.endDate}`;
    }

    const res = await fetch(url, {
      headers: token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    const json = await res.json();
    
    return {
      raw: json.keywords || [],
      formatted: (json.keywords || []).map((k) => ({
        keyword: k.text,
        clicks: k.clicks >= 1000 ? `${(k.clicks / 1000).toFixed(1)} K` : k.clicks,
        impressions: k.impressions >= 1000 ? `${(k.impressions / 1000).toFixed(1)} K` : k.impressions,
        cpc: `$ ${k.cpc.toFixed(2)}`,
        ctr: `${k.ctr.toFixed(2)}%`,
        cost: `$ ${k.cost.toFixed(2)}`,
      }))
    };
  };

  const cacheKey = period === 'CUSTOM' && customDates?.startDate && customDates?.endDate
    ? `${period}-${customDates.startDate}-${customDates.endDate}`
    : period;

  const { data: keywordsData, loading, error } = useApiWithCache(
    activeCampaign?.id,
    cacheKey,
    'keywords',
    keywordsApiCall
  );

  const downloadCSV = () => {
    if (!keywordsData?.raw?.length) {
      alert("No keywords data available to download");
      return;
    }

    try {
      setDownloading(true);
      
      const csvData = keywordsData.raw.map(k => [
        `"${k.text}"`,
        k.clicks,
        k.impressions,
        k.cpc.toFixed(2),
        k.ctr.toFixed(2),
        k.cost.toFixed(2)
      ]);

      const headers = ['Keyword', 'Clicks', 'Impressions', 'CPC', 'CTR (%)', 'Cost'];
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `keywords_${activeCampaign?.name || 'campaign'}_${period}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download keywords:", err);
      alert("Failed to download keywords data");
    } finally {
      setDownloading(false);
    }
  };

  const displayedKeywords = showAll ? keywordsData?.formatted : keywordsData?.formatted?.slice(0, 4);
  const shouldShowViewMore = (keywordsData?.formatted?.length || 0) > 4;

  if (loading && !keywordsData) return <p>Loading keywords...</p>;
  if (!keywordsData?.formatted?.length) return <p>No keywords data available.</p>;

  return (
    <div className="w-full bg-white rounded-2xl p-2 shadow-sm">
      <div className="bg-white overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Performing Keywords
          </h2>
          <button 
            onClick={downloadCSV}
            disabled={downloading || !keywordsData?.raw?.length}
            className={`p-2 rounded transition-colors ${
              downloading || !keywordsData?.raw?.length
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={downloading ? "Downloading..." : "Download CSV"}
          >
            <Download size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">Keyword</th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">Clicks</th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">Impressions</th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">CPC</th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">CTR</th>
                <th className="px-6 py-3 text-left text-[18px] font-bold text-black">Cost</th>
              </tr>
            </thead>
          </table>

          <div className={`${showAll ? "max-h-96 overflow-y-auto" : ""} transition-all duration-300`}>
            <table className="w-full min-w-[600px] table-fixed">
              <tbody className="divide-y divide-gray-200">
                {displayedKeywords?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-md text-black font-medium">{row.keyword}</td>
                    <td className="px-6 py-4 text-md text-black font-medium">{row.clicks}</td>
                    <td className="px-6 py-4 text-md text-black font-medium">{row.impressions}</td>
                    <td className="px-6 py-4 text-md text-black font-medium">{row.cpc}</td>
                    <td className="px-6 py-4 text-md text-black font-medium">{row.ctr}</td>
                    <td className="px-6 py-4 text-md text-black font-medium">{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {shouldShowViewMore && (
          <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-center rounded-b-2xl">
            <button
              onClick={() => setShowAll(!showAll)}
              className="py-2 px-8 bg-[#508995] hover:bg-teal-700 text-white text-sm font-medium rounded transition-colors duration-200"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KeywordTable;