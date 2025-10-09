import React, { useState } from "react";

function MetaAdsTable({ ads = [], currency = "MYR", onLoadStats, selectedAdsForStats = [] }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Sync selectedRows with selectedAdsForStats when stats are showing
  React.useEffect(() => {
    if (selectedAdsForStats.length > 0) {
      const statsIds = selectedAdsForStats.map(a => a.id);
      setSelectedRows(new Set(statsIds));
    }
  }, [selectedAdsForStats]);
  
  const toggleRow = (adId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(adId)) {
      newSelected.delete(adId);
    } else {
      newSelected.add(adId);
    }
    setSelectedRows(newSelected);
  };
  
  const toggleAll = () => {
    if (selectedRows.size === ads.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(ads.map(a => a.id)));
    }
  };
  
  const downloadCSV = () => {
    const headers = [
      "Ad Name", 
      "Ad Set ID", 
      "Status", 
      "Spend",
      "Impressions",
      "Reach",
      "Clicks",
      "CTR",
      "CPC",
      "CPM",
      "Created Time", 
      "Updated Time"
    ];
    
    const rows = ads.map(a => [
      a.name,
      a.ad_set_id,
      a.status,
      a.spend || 0,
      a.impressions || 0,
      a.reach || 0,
      a.clicks || 0,
      a.ctr || 0,
      a.cpc || 0,
      a.cpm || 0,
      a.created_time,
      a.updated_time
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta_ads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLoadStats = () => {
    const selectedAds = ads.filter(a => selectedRows.has(a.id));
    if (selectedAds.length === 0) {
      alert("Please select at least one ad to load statistics.");
      return;
    }
    onLoadStats(selectedAds);
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  // Helper function to format currency
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return `${currency} 0.00`;
    return `${currency} ${Number(num).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };
  
  if (!ads || ads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p>No ad data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ads Performance</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {ads.length} ad{ads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1A4752] text-white rounded hover:bg-[#0F3942] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download CSV</span>
        </button>
      </div>
      
      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === ads.length && ads.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752] cursor-pointer"
                    title="Select all ads"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Preview
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">
                  Ad Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Spend
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Impressions
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                  Reach
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Clicks
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  CTR
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                  CPC
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                  CPM
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map((ad) => {
                // Get media URL (prefer image_url, fallback to thumbnail_url)
                const mediaUrl = ad.creative?.media_url || 
                               ad.creative?.image_url || 
                               ad.creative?.thumbnail_url;
                
                return (
                  <tr 
                    key={ad.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedRows.has(ad.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(ad.id)}
                        onChange={() => toggleRow(ad.id)}
                        className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 w-24">
                      {mediaUrl ? (
                        <img 
                          src={mediaUrl} 
                          alt={ad.name}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 min-w-[200px]">
                      <div className="max-w-[200px] truncate" title={ad.name}>
                        {ad.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 w-24">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                        ad.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : ad.status === 'PAUSED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-32 whitespace-nowrap">
                      {formatCurrency(ad.spend)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-32">
                      {formatNumber(ad.impressions)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-28">
                      {formatNumber(ad.reach)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-24">
                      {formatNumber(ad.clicks)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-24">
                      {ad.ctr !== null && ad.ctr !== undefined ? `${ad.ctr.toFixed(2)}%` : '0.00%'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-28 whitespace-nowrap">
                      {formatCurrency(ad.cpc)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 w-28 whitespace-nowrap">
                      {formatCurrency(ad.cpm)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 w-32">
                      {ad.created_time ? new Date(ad.created_time).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Action Footer */}
      {selectedRows.size > 0 && (
        <div className="p-4 bg-blue-50 border-t border-blue-200 flex justify-between items-center">
          <p className="text-sm text-blue-900 font-medium">
            {selectedRows.size} ad{selectedRows.size > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleLoadStats}
            className="flex items-center space-x-2 px-6 py-2 bg-[#1A4752] text-white rounded-lg hover:bg-[#0F3942] transition-colors font-medium shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Load Stats for Selected Ads</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MetaAdsTable;