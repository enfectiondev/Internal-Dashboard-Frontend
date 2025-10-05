import React from "react";

function MetaMetricCard({ title, value, subtitle, currency = "", showNoData = false }) {
  if (showNoData) {
    return (
      <div className="bg-gray-50 text-gray-400 p-4 rounded-lg shadow-sm border-l-4 border-gray-300 relative">
        <div className="text-[15px] text-gray-400 font-bold mb-1 uppercase tracking-wide">{title}</div>
        <div className="text-4xl font-bold text-gray-300">--</div>
        <div className="text-[13px] font-medium text-gray-400 mt-1">No data available</div>
        <div className="absolute top-2 right-2">
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m-2 0v3a2 2 0 002 2h2M4 13V8a2 2 0 012-2h2" />
          </svg>
        </div>
      </div>
    );
  }

  const displayValue = value !== null && value !== undefined ? value : '--';
  const isNoValue = value === null || value === undefined || value === '--';
  
  // Format value with currency if provided
  const formattedValue = !isNoValue && currency 
    ? `${currency} ${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
    : displayValue;

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
        {formattedValue}
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
    </div>
  );
}

export default MetaMetricCard;