import React, { useState } from "react";

export default function SeedKeywordsInput({ 
  keywords = [], 
  onAddKeyword, 
  onRemoveKeyword, 
  maxKeywords = 10 
}) {
  const [inputValue, setInputValue] = useState("");

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      onAddKeyword(inputValue.trim());
      setInputValue("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    onRemoveKeyword(keywordToRemove);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Seed Keywords
        </h3>
      </div>

      {/* Keywords Container */}
      <div style={{ backgroundColor: '#F1ECEC' }} className="rounded-lg p-4 min-h-[120px] relative">
        {/* Keywords Display */}
        <div className="flex flex-wrap gap-2 mb-2">
          {keywords.map((keyword, index) => (
            <div
              key={`keyword-${index}`}
              className="text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
              style={{ backgroundColor: '#508995' }}
            >
              <span>{String(keyword)}</span>
              <button
                onClick={() => handleRemoveKeyword(keyword)}
                className="text-white hover:text-gray-200 text-lg leading-none"
                aria-label={`Remove ${keyword}`}
                onMouseEnter={(e) => e.target.style.color = '#F1ECEC'}
                onMouseLeave={(e) => e.target.style.color = '#FFFFFF'}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={keywords.length === 0 ? "Enter keywords..." : ""}
            className="bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 flex-1"
            disabled={keywords.length >= maxKeywords}
          />
        </div>

        {/* Max Keywords Indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          (max {maxKeywords})
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to add keywords. You can add up to {maxKeywords} keywords.
      </div>
    </div>
  );
}