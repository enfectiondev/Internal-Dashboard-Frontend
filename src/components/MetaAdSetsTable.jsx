import React, { useState } from "react";

function MetaAdSetsTable({ adsets = [], currency = "MYR", onLoadStats, selectedAdSetsForStats = [] }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showAll, setShowAll] = useState(false);
  
  // Always display all adsets, no slicing
  const displayedAdSets = adsets;
  
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
    if (selectedRows.size === displayedAdSets.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(displayedAdSets.map(a => a.id)));
    }
  };
  
  const downloadCSV = () => {
    const headers = ["Ad Set Name", "Campaign ID", "Status", "Optimization Goal", "Billing Event", "Daily Budget", "Lifetime Budget", "Budget Remaining", "Locations"];
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
    a.download = 'meta_adsets.csv';
    a.click();
  };

  const handleLoadStats = () => {
    const selectedAdSets = adsets.filter(a => selectedRows.has(a.id));
    onLoadStats(selectedAdSets);
  };
  
  if (!adsets || adsets.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 text-center text-gray-500">
        No ad set data available
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Ad Sets</h3>
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
        {/* Show first 5 rows by default, all rows with scroll when showAll is true */}
        <div className={`overflow-y-auto ${showAll ? 'max-h-[500px]' : 'max-h-[300px]'}`}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              {/* ...thead stays the same... */}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Show only first 5 when showAll is false, all when true */}
              {(showAll ? displayedAdSets : displayedAdSets.slice(0, 5)).map((adset) => (
                {/* ...tbody stays the same... */}
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {adsets.length > 5 && (
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
            {selectedRows.size} ad set{selectedRows.size > 1 ? 's' : ''} selected
          </p>
          <button
            onClick={handleLoadStats}
            className="flex items-center space-x-2 px-6 py-2 bg-[#1A4752] text-white rounded-lg hover:bg-[#0F3942] transition-colors font-medium"
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