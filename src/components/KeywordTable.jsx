import React, { useState, useEffect } from "react";
import { Download } from "lucide-react";

function KeywordTable() {
  const [keywords, setKeywords] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/ads/keywords/3220426249?period=LAST_30_DAYS&offset=0&limit=50",
          {
            headers: token
              ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
              : { "Content-Type": "application/json" },
          }
        );
        if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
        const json = await res.json();
        const transformed = (json.keywords || []).map((k) => ({
          keyword: k.text,
          clicks: k.clicks >= 1000 ? `${(k.clicks / 1000).toFixed(1)} K` : k.clicks,
          impressions: k.impressions >= 1000 ? `${(k.impressions / 1000).toFixed(1)} K` : k.impressions,
          cpc: `$ ${k.cpc.toFixed(2)}`,
          ctr: `${k.ctr.toFixed(2)}%`,
          cost: `$ ${k.cost.toFixed(2)}`,
        }));
        setKeywords(transformed);
      } catch (err) {
        console.error("Failed to fetch keywords:", err);
        setKeywords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywords();
  }, []);

  const displayedKeywords = showAll ? keywords : keywords.slice(0, 4);
  const shouldShowViewMore = keywords.length > 4;

  if (loading) return <p>Loading keywords...</p>;
  if (!keywords.length) return <p>No keywords data available.</p>;

  return (
    <div className="w-full bg-white rounded-2xl p-2 shadow-sm">
      <div className="bg-white overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Performing Keywords
          </h2>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            <Download size={20} />
          </button>
        </div>

        {/* Table */}
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
                {displayedKeywords.map((row, idx) => (
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

        {/* View More Button */}
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
