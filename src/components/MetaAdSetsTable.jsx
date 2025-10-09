import React, { useState } from "react";

function MetaAdSetsTable({ adsets = [], currency = "MYR", onLoadStats, selectedAdSetsForStats = [] }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Sync selectedRows with selectedAdSetsForStats when stats are showing
  React.useEffect(() => {
    if (selectedAdSetsForStats.length > 0) {
      const statsIds = selectedAdSetsForStats.map(a => a.id);
      setSelectedRows(new Set(statsIds));
    }
  }, [selectedAdSetsForStats]);
  
  const toggleRow = (adsetId) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(adsetId)) {
      newSelected.delete(adsetId);
    } else {
      newSelected.add(adsetId);
    }
    setSelectedRows(newSelected);
  };
  
  const toggleAll = () => {
    if (selectedRows.size === adsets.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(adsets.map(a => a.id)));
    }
  };
  
  const downloadCSV = () => {
    const headers = [
      "Ad Set Name", 
      "Campaign ID", 
      "Status", 
      "Optimization Goal", 
      "Billing Event", 
      "Daily Budget", 
      "Lifetime Budget", 
      "Budget Remaining", 
      "Locations"
    ];
    
    const rows = adsets.map(a => [
      a.name,
      a.campaign_id,
      a.status,
      a.optimization_goal,
      a.billing_event,
      a.daily_budget,
      a.lifetime_budget,
      a.budget_remaining,
      a.locations.join('; ')
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta_adsets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLoadStats = () => {
    const selectedAdSets = adsets.filter(a => selectedRows.has(a.id));
    if (selectedAdSets.length === 0) {
      alert("Please select at least one ad set to load statistics.");
      return;
    }
    onLoadStats(selectedAdSets);
  };
  
  if (!adsets || adsets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No ad set data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Ad Sets Performance</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {adsets.length} ad set{adsets.length !== 1 ? 's' : ''}
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
                    checked={selectedRows.size === adsets.length && adsets.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752] cursor-pointer"
                    title="Select all ad sets"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Ad Set Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-40">
                  Optimization Goal
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Billing Event
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Daily Budget
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Lifetime Budget
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                  Budget Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Target Locations
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adsets.map((adset) => (
                <tr 
                  key={adset.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedRows.has(adset.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(adset.id)}
                      onChange={() => toggleRow(adset.id)}
                      className="w-4 h-4 text-[#1A4752] rounded focus:ring-[#1A4752] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {adset.name}
                  </td>
                  <td className="px-4 py-3 w-24">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      adset.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : adset.status === 'PAUSED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {adset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 w-40">
                    {adset.optimization_goal || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 w-32">
                    {adset.billing_event || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 w-32">
                    {adset.daily_budget > 0 
                      ? `${currency} ${adset.daily_budget.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 w-32">
                    {adset.lifetime_budget > 0 
                      ? `${currency} ${adset.lifetime_budget.toLocaleString(undefined, {minimumFractionDigits: 2})}` 
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 w-32">
                    {currency} {adset.budget_remaining.toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={adset.locations.join(', ')}>
                      {adset.locations.length > 0 ? adset.locations.join(', ') : 'Not specified'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Action Footer */}
      {selectedRows.size > 0 && (
        <div className="p-4 bg-blue-50 border-t border-blue-200 flex justify-between items-center">
          <p className="text-sm text-blue-900 font-medium">
            {selectedRows.size} ad set{selectedRows.size > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleLoadStats}
            className="flex items-center space-x-2 px-6 py-2 bg-[#1A4752] text-white rounded-lg hover:bg-[#0F3942] transition-colors font-medium shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Load Stats for Selected Ad Sets</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MetaAdSetsTable;