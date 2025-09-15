import React, { useState } from "react";

export default function CountrySelector({ selectedCountry, onCountryChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const countries = [
    { value: "World Wide earth", label: "🌍 World Wide earth", flag: "🌍" },
    { value: "United States", label: "🇺🇸 United States", flag: "🇺🇸" },
    { value: "United Kingdom", label: "🇬🇧 United Kingdom", flag: "🇬🇧" },
    { value: "Canada", label: "🇨🇦 Canada", flag: "🇨🇦" },
    { value: "Australia", label: "🇦🇺 Australia", flag: "🇦🇺" },
    { value: "Germany", label: "🇩🇪 Germany", flag: "🇩🇪" },
    { value: "France", label: "🇫🇷 France", flag: "🇫🇷" },
    { value: "Japan", label: "🇯🇵 Japan", flag: "🇯🇵" },
    { value: "India", label: "🇮🇳 India", flag: "🇮🇳" },
    { value: "Brazil", label: "🇧🇷 Brazil", flag: "🇧🇷" }
  ];

  const selectedCountryData = countries.find(c => c.value === selectedCountry) || countries[0];

  const handleSelect = (country) => {
    onCountryChange(country.value);
    setIsOpen(false);
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="p-4 rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Country</h3>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-white px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
          style={{ backgroundColor: '#508995' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0E4854'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#508995'}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{selectedCountryData.flag}</span>
            <span className="font-medium">{String(selectedCountry)}</span>
          </div>
          <svg 
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div style={{ backgroundColor: '#FFFFFF' }} className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
            {countries.map((country, index) => (
              <button
                key={index}
                onClick={() => handleSelect(country)}
                className={`w-full px-4 py-3 text-left flex items-center space-x-2 transition-colors ${
                  selectedCountry === country.value ? 'text-white' : 'text-gray-900'
                }`}
                style={{ 
                  backgroundColor: selectedCountry === country.value ? '#508995' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedCountry !== country.value) {
                    e.target.style.backgroundColor = '#F1ECEC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCountry !== country.value) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="text-lg">{country.flag}</span>
                <span>{String(country.value)}</span>
                {selectedCountry === country.value && (
                  <span className="ml-auto text-white">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}