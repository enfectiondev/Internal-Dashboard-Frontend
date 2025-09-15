import React from "react";

export default function KeywordCards({ keywords = [], timeFrame = "Monthly" }) {
  if (!keywords.length) {
    return (
      <div style={{ backgroundColor: '#FFFFFF' }} className="p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center text-gray-500">
          No keyword data available. Add seed keywords to see search volume data.
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#508995' }} className="p-6 rounded-lg shadow-lg">
      {/* Scrollable Container */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {keywords.map((keyword, index) => (
            <div
              key={`keyword-card-${index}`}
              className={`
                flex-shrink-0 w-60 p-4 rounded-lg shadow-md transition-all duration-300 relative
                ${keyword.isHighlighted ? 'transform scale-105' : ''}
              `}
              style={{ 
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderLeft: `6px solid ${keyword.isHighlighted ? '#508995' : '#0E4854'}`,
                height: '160px'
              }}
            >
              {/* Keyword Title - Top Left */}
              <div className="mb-3">
                <h4 className="text-lg font-bold uppercase tracking-wide text-left" style={{ 
                  color: '#0E4854'
                }}>
                  {String(keyword.keyword)}
                </h4>
              </div>

              {/* Search Volume - Center */}
              <div className="mb-3 text-center">
                <div className="text-xs font-medium mb-1 text-gray-500">
                  Avg. Mon. Searches
                </div>
                <div className="text-3xl font-bold" style={{ 
                  color: '#000000'
                }}>
                  {String(keyword.searches)}
                </div>
              </div>

              {/* Competition Level - Same Line: Label Left, Value Right */}
              <div className="flex justify-between items-center">
                <div className="text-xs font-medium text-gray-500">
                  Competition:
                </div>
                <span className="px-2 py-1 rounded text-xs font-bold" style={{ 
                  backgroundColor: keyword.isHighlighted ? '#508995' : '#0E4854',
                  color: '#FFFFFF'
                }}>
                  {String(keyword.competition)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}