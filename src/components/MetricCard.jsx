import React from "react";

function MetricCard({ title, value, subtitle, showNoData = false }) {
  if (showNoData) {
    return (
      <div className="bg-gray-50 text-gray-400 p-4 rounded-lg shadow-sm border-l-4 border-gray-300 relative">
        <div className="text-[15px] text-gray-400 font-bold mb-1 uppercase tracking-wide">{title}</div>
        <div className="text-4xl font-bold text-gray-300">--</div>
        <div className="text-[13px] font-medium text-gray-400 mt-1">No data available</div>
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m-2 0v3a2 2 0 002 2h2M4 13V8a2 2 0 012-2h2" />
          </svg>
        </div>
      </div>
    );
  }

  // Handle missing or invalid values
  const displayValue = value && value !== 'N/A' ? value : '--';
  const isNoValue = !value || value === 'N/A' || value === '--';

  return (
    <div className={`p-4 rounded-lg shadow-sm border-l-4 ${
      isNoValue 
        ? 'bg-gray-50 text-gray-400 border-gray-300' 
        : 'bg-white text-gray-800 border-black'
    }`}>
      <div className={`text-[15px] font-bold mb-1 uppercase tracking-wide ${
        isNoValue ? 'text-gray-400' : 'text-[#1A4752]'
      }`}>
        {title}
      </div>
      <div className={`text-4xl font-bold ${
        isNoValue ? 'text-gray-300' : 'text-black'
      }`}>
        {displayValue}
      </div>
      {subtitle && (
        <div className={`text-[13px] font-bold mt-1 ${
          isNoValue ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {subtitle}
        </div>
      )}
      {isNoValue && !subtitle && (
        <div className="text-[13px] font-medium text-gray-400 mt-1">
          No data available
        </div>
      )}
      {isNoValue && (
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default MetricCard;