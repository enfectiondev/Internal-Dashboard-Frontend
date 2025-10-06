import React, { useState } from "react";

function MetaCampaignsTable({ campaigns = [], currency = "MYR", onLoadStats }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  
  const displayedCampaigns = showAll ? campaigns : campaigns.slice(0, 5);
  
  const toggleRow = (campaignId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedRows(newSelected);
  };
  
  const toggleAll = () => {
    if (selectedRows.size === displayedCampaigns.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(displayedCampaigns.map(c => c.campaign_id)));
    }
  };
  
  const downloadCSV = () => {
    const headers = ["Campaign Name", "Status", "Spend", "Impressions", "Clicks", "Conversions", "CPC", "CPM", "CTR", "Reach", "Frequency"];
    const rows = campaigns.map(c => [
      c.campaign_name,
      c.status,
      c.spend,
      c.impressions,
      c.clicks,
      c.conversions,
      c.cpc,
      c.cpm,
      c.ctr,
      c.reach,
      c.frequency
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meta_campaigns.csv';
    a.click();
  };

  const handleLoadStats = () => {
    const selectedCampaigns = campaigns.filter(c => selectedRows.has(c.campaign_id));
    onLoadStats(selectedCampaigns);
  };
  
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center text-gray-500">
        No campaign data available
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Campaign Performance</h3>
        <button
          onClick={downloadCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-[#1A4752] text-white rounded hover:bg-[#0F3942] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === displayedCampaigns.length && displayedCampaigns.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752]"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Campaign Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Spend</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Impressions</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Clicks</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">CPC</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">CTR</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Reach</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedCampaigns.map((campaign) => (
              <tr 
                key={campaign.campaign_id}
                className={`hover:bg-gray-50 transition-colors ${selectedRows.has(campaign.campaign_id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(campaign.campaign_id)}
                    onChange={() => toggleRow(campaign.campaign_id)}
                    className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752]"
                  />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{campaign.campaign_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{currency} {campaign.spend.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{campaign.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{campaign.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{currency} {campaign.cpc.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{campaign.ctr.toFixed(2)}%</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{campaign.reach.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {campaigns.length > 5 && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-[#508995] text-white rounded-lg hover:bg-[#3F7380] transition-colors font-medium"
          >
            {showAll ? 'Show Less' : 'View More'}
          </button>
        </div>
      )}
      
      {selectedRows.size > 0 && (
        <div className="p-4 bg-blue-50 border-t border-blue-200 flex justify-between items-center">
          <p className="text-sm text-blue-900">
            {selectedRows.size} campaign{selectedRows.size > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleLoadStats}
            className="flex items-center space-x-2 px-6 py-2 bg-[#1A4752] text-white rounded-lg hover:bg-[#0F3942] transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Load Stats for Selected Campaigns</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MetaCampaignsTable;