import React, { useState, useMemo, useRef, useEffect } from "react";

export default function CountrySelector({ selectedCountry, onCountryChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef(null);

const countries = [
    { value: "World Wide earth", label: "🌍 World Wide earth", flag: "🌍" },
    { value: "Afghanistan", label: "🇦🇫 Afghanistan", flag: "🇦🇫" },
    { value: "Albania", label: "🇦🇱 Albania", flag: "🇦🇱" },
    { value: "Algeria", label: "🇩🇿 Algeria", flag: "🇩🇿" },
    { value: "Andorra", label: "🇦🇩 Andorra", flag: "🇦🇩" },
    { value: "Angola", label: "🇦🇴 Angola", flag: "🇦🇴" },
    { value: "Argentina", label: "🇦🇷 Argentina", flag: "🇦🇷" },
    { value: "Armenia", label: "🇦🇲 Armenia", flag: "🇦🇲" },
    { value: "Australia", label: "🇦🇺 Australia", flag: "🇦🇺" },
    { value: "Austria", label: "🇦🇹 Austria", flag: "🇦🇹" },
    { value: "Azerbaijan", label: "🇦🇿 Azerbaijan", flag: "🇦🇿" },
    { value: "Bahamas", label: "🇧🇸 Bahamas", flag: "🇧🇸" },
    { value: "Bahrain", label: "🇧🇭 Bahrain", flag: "🇧🇭" },
    { value: "Bangladesh", label: "🇧🇩 Bangladesh", flag: "🇧🇩" },
    { value: "Barbados", label: "🇧🇧 Barbados", flag: "🇧🇧" },
    { value: "Belarus", label: "🇧🇾 Belarus", flag: "🇧🇾" },
    { value: "Belgium", label: "🇧🇪 Belgium", flag: "🇧🇪" },
    { value: "Belize", label: "🇧🇿 Belize", flag: "🇧🇿" },
    { value: "Benin", label: "🇧🇯 Benin", flag: "🇧🇯" },
    { value: "Bhutan", label: "🇧🇹 Bhutan", flag: "🇧🇹" },
    { value: "Bolivia", label: "🇧🇴 Bolivia", flag: "🇧🇴" },
    { value: "Bosnia and Herzegovina", label: "🇧🇦 Bosnia and Herzegovina", flag: "🇧🇦" },
    { value: "Botswana", label: "🇧🇼 Botswana", flag: "🇧🇼" },
    { value: "Brazil", label: "🇧🇷 Brazil", flag: "🇧🇷" },
    { value: "Brunei", label: "🇧🇳 Brunei", flag: "🇧🇳" },
    { value: "Bulgaria", label: "🇧🇬 Bulgaria", flag: "🇧🇬" },
    { value: "Burkina Faso", label: "🇧🇫 Burkina Faso", flag: "🇧🇫" },
    { value: "Burundi", label: "🇧🇮 Burundi", flag: "🇧🇮" },
    { value: "Cambodia", label: "🇰🇭 Cambodia", flag: "🇰🇭" },
    { value: "Cameroon", label: "🇨🇲 Cameroon", flag: "🇨🇲" },
    { value: "Canada", label: "🇨🇦 Canada", flag: "🇨🇦" },
    { value: "Cape Verde", label: "🇨🇻 Cape Verde", flag: "🇨🇻" },
    { value: "Central African Republic", label: "🇨🇫 Central African Republic", flag: "🇨🇫" },
    { value: "Chad", label: "🇹🇩 Chad", flag: "🇹🇩" },
    { value: "Chile", label: "🇨🇱 Chile", flag: "🇨🇱" },
    { value: "China", label: "🇨🇳 China", flag: "🇨🇳" },
    { value: "Colombia", label: "🇨🇴 Colombia", flag: "🇨🇴" },
    { value: "Comoros", label: "🇰🇲 Comoros", flag: "🇰🇲" },
    { value: "Congo", label: "🇨🇬 Congo", flag: "🇨🇬" },
    { value: "Costa Rica", label: "🇨🇷 Costa Rica", flag: "🇨🇷" },
    { value: "Croatia", label: "🇭🇷 Croatia", flag: "🇭🇷" },
    { value: "Cuba", label: "🇨🇺 Cuba", flag: "🇨🇺" },
    { value: "Cyprus", label: "🇨🇾 Cyprus", flag: "🇨🇾" },
    { value: "Czech Republic", label: "🇨🇿 Czech Republic", flag: "🇨🇿" },
    { value: "Denmark", label: "🇩🇰 Denmark", flag: "🇩🇰" },
    { value: "Djibouti", label: "🇩🇯 Djibouti", flag: "🇩🇯" },
    { value: "Dominica", label: "🇩🇲 Dominica", flag: "🇩🇲" },
    { value: "Dominican Republic", label: "🇩🇴 Dominican Republic", flag: "🇩🇴" },
    { value: "Ecuador", label: "🇪🇨 Ecuador", flag: "🇪🇨" },
    { value: "Egypt", label: "🇪🇬 Egypt", flag: "🇪🇬" },
    { value: "El Salvador", label: "🇸🇻 El Salvador", flag: "🇸🇻" },
    { value: "Equatorial Guinea", label: "🇬🇶 Equatorial Guinea", flag: "🇬🇶" },
    { value: "Eritrea", label: "🇪🇷 Eritrea", flag: "🇪🇷" },
    { value: "Estonia", label: "🇪🇪 Estonia", flag: "🇪🇪" },
    { value: "Eswatini", label: "🇸🇿 Eswatini", flag: "🇸🇿" },
    { value: "Ethiopia", label: "🇪🇹 Ethiopia", flag: "🇪🇹" },
    { value: "Fiji", label: "🇫🇯 Fiji", flag: "🇫🇯" },
    { value: "Finland", label: "🇫🇮 Finland", flag: "🇫🇮" },
    { value: "France", label: "🇫🇷 France", flag: "🇫🇷" },
    { value: "Gabon", label: "🇬🇦 Gabon", flag: "🇬🇦" },
    { value: "Gambia", label: "🇬🇲 Gambia", flag: "🇬🇲" },
    { value: "Georgia", label: "🇬🇪 Georgia", flag: "🇬🇪" },
    { value: "Germany", label: "🇩🇪 Germany", flag: "🇩🇪" },
    { value: "Ghana", label: "🇬🇭 Ghana", flag: "🇬🇭" },
    { value: "Greece", label: "🇬🇷 Greece", flag: "🇬🇷" },
    { value: "Grenada", label: "🇬🇩 Grenada", flag: "🇬🇩" },
    { value: "Guatemala", label: "🇬🇹 Guatemala", flag: "🇬🇹" },
    { value: "Guinea", label: "🇬🇳 Guinea", flag: "🇬🇳" },
    { value: "Guinea-Bissau", label: "🇬🇼 Guinea-Bissau", flag: "🇬🇼" },
    { value: "Guyana", label: "🇬🇾 Guyana", flag: "🇬🇾" },
    { value: "Haiti", label: "🇭🇹 Haiti", flag: "🇭🇹" },
    { value: "Honduras", label: "🇭🇳 Honduras", flag: "🇭🇳" },
    { value: "Hungary", label: "🇭🇺 Hungary", flag: "🇭🇺" },
    { value: "Iceland", label: "🇮🇸 Iceland", flag: "🇮🇸" },
    { value: "India", label: "🇮🇳 India", flag: "🇮🇳" },
    { value: "Indonesia", label: "🇮🇩 Indonesia", flag: "🇮🇩" },
    { value: "Iran", label: "🇮🇷 Iran", flag: "🇮🇷" },
    { value: "Iraq", label: "🇮🇶 Iraq", flag: "🇮🇶" },
    { value: "Ireland", label: "🇮🇪 Ireland", flag: "🇮🇪" },
    { value: "Israel", label: "🇮🇱 Israel", flag: "🇮🇱" },
    { value: "Italy", label: "🇮🇹 Italy", flag: "🇮🇹" },
    { value: "Jamaica", label: "🇯🇲 Jamaica", flag: "🇯🇲" },
    { value: "Japan", label: "🇯🇵 Japan", flag: "🇯🇵" },
    { value: "Jordan", label: "🇯🇴 Jordan", flag: "🇯🇴" },
    { value: "Kazakhstan", label: "🇰🇿 Kazakhstan", flag: "🇰🇿" },
    { value: "Kenya", label: "🇰🇪 Kenya", flag: "🇰🇪" },
    { value: "Kiribati", label: "🇰🇮 Kiribati", flag: "🇰🇮" },
    { value: "Kuwait", label: "🇰🇼 Kuwait", flag: "🇰🇼" },
    { value: "Kyrgyzstan", label: "🇰🇬 Kyrgyzstan", flag: "🇰🇬" },
    { value: "Laos", label: "🇱🇦 Laos", flag: "🇱🇦" },
    { value: "Latvia", label: "🇱🇻 Latvia", flag: "🇱🇻" },
    { value: "Lebanon", label: "🇱🇧 Lebanon", flag: "🇱🇧" },
    { value: "Lesotho", label: "🇱🇸 Lesotho", flag: "🇱🇸" },
    { value: "Liberia", label: "🇱🇷 Liberia", flag: "🇱🇷" },
    { value: "Libya", label: "🇱🇾 Libya", flag: "🇱🇾" },
    { value: "Liechtenstein", label: "🇱🇮 Liechtenstein", flag: "🇱🇮" },
    { value: "Lithuania", label: "🇱🇹 Lithuania", flag: "🇱🇹" },
    { value: "Luxembourg", label: "🇱🇺 Luxembourg", flag: "🇱🇺" },
    { value: "Madagascar", label: "🇲🇬 Madagascar", flag: "🇲🇬" },
    { value: "Malawi", label: "🇲🇼 Malawi", flag: "🇲🇼" },
    { value: "Malaysia", label: "🇲🇾 Malaysia", flag: "🇲🇾" },
    { value: "Maldives", label: "🇲🇻 Maldives", flag: "🇲🇻" },
    { value: "Mali", label: "🇲🇱 Mali", flag: "🇲🇱" },
    { value: "Malta", label: "🇲🇹 Malta", flag: "🇲🇹" },
    { value: "Marshall Islands", label: "🇲🇭 Marshall Islands", flag: "🇲🇭" },
    { value: "Mauritania", label: "🇲🇷 Mauritania", flag: "🇲🇷" },
    { value: "Mauritius", label: "🇲🇺 Mauritius", flag: "🇲🇺" },
    { value: "Mexico", label: "🇲🇽 Mexico", flag: "🇲🇽" },
    { value: "Micronesia", label: "🇫🇲 Micronesia", flag: "🇫🇲" },
    { value: "Moldova", label: "🇲🇩 Moldova", flag: "🇲🇩" },
    { value: "Monaco", label: "🇲🇨 Monaco", flag: "🇲🇨" },
    { value: "Mongolia", label: "🇲🇳 Mongolia", flag: "🇲🇳" },
    { value: "Montenegro", label: "🇲🇪 Montenegro", flag: "🇲🇪" },
    { value: "Morocco", label: "🇲🇦 Morocco", flag: "🇲🇦" },
    { value: "Mozambique", label: "🇲🇿 Mozambique", flag: "🇲🇿" },
    { value: "Myanmar", label: "🇲🇲 Myanmar", flag: "🇲🇲" },
    { value: "Namibia", label: "🇳🇦 Namibia", flag: "🇳🇦" },
    { value: "Nauru", label: "🇳🇷 Nauru", flag: "🇳🇷" },
    { value: "Nepal", label: "🇳🇵 Nepal", flag: "🇳🇵" },
    { value: "Netherlands", label: "🇳🇱 Netherlands", flag: "🇳🇱" },
    { value: "New Zealand", label: "🇳🇿 New Zealand", flag: "🇳🇿" },
    { value: "Nicaragua", label: "🇳🇮 Nicaragua", flag: "🇳🇮" },
    { value: "Niger", label: "🇳🇪 Niger", flag: "🇳🇪" },
    { value: "Nigeria", label: "🇳🇬 Nigeria", flag: "🇳🇬" },
    { value: "North Korea", label: "🇰🇵 North Korea", flag: "🇰🇵" },
    { value: "North Macedonia", label: "🇲🇰 North Macedonia", flag: "🇲🇰" },
    { value: "Norway", label: "🇳🇴 Norway", flag: "🇳🇴" },
    { value: "Oman", label: "🇴🇲 Oman", flag: "🇴🇲" },
    { value: "Pakistan", label: "🇵🇰 Pakistan", flag: "🇵🇰" },
    { value: "Palau", label: "🇵🇼 Palau", flag: "🇵🇼" },
    { value: "Palestine", label: "🇵🇸 Palestine", flag: "🇵🇸" },
    { value: "Panama", label: "🇵🇦 Panama", flag: "🇵🇦" },
    { value: "Papua New Guinea", label: "🇵🇬 Papua New Guinea", flag: "🇵🇬" },
    { value: "Paraguay", label: "🇵🇾 Paraguay", flag: "🇵🇾" },
    { value: "Peru", label: "🇵🇪 Peru", flag: "🇵🇪" },
    { value: "Philippines", label: "🇵🇭 Philippines", flag: "🇵🇭" },
    { value: "Poland", label: "🇵🇱 Poland", flag: "🇵🇱" },
    { value: "Portugal", label: "🇵🇹 Portugal", flag: "🇵🇹" },
    { value: "Qatar", label: "🇶🇦 Qatar", flag: "🇶🇦" },
    { value: "Romania", label: "🇷🇴 Romania", flag: "🇷🇴" },
    { value: "Russia", label: "🇷🇺 Russia", flag: "🇷🇺" },
    { value: "Rwanda", label: "🇷🇼 Rwanda", flag: "🇷🇼" },
    { value: "Saint Kitts and Nevis", label: "🇰🇳 Saint Kitts and Nevis", flag: "🇰🇳" },
    { value: "Saint Lucia", label: "🇱🇨 Saint Lucia", flag: "🇱🇨" },
    { value: "Saint Vincent and the Grenadines", label: "🇻🇨 Saint Vincent and the Grenadines", flag: "🇻🇨" },
    { value: "Samoa", label: "🇼🇸 Samoa", flag: "🇼🇸" },
    { value: "San Marino", label: "🇸🇲 San Marino", flag: "🇸🇲" },
    { value: "Sao Tome and Principe", label: "🇸🇹 Sao Tome and Principe", flag: "🇸🇹" },
    { value: "Saudi Arabia", label: "🇸🇦 Saudi Arabia", flag: "🇸🇦" },
    { value: "Senegal", label: "🇸🇳 Senegal", flag: "🇸🇳" },
    { value: "Serbia", label: "🇷🇸 Serbia", flag: "🇷🇸" },
    { value: "Seychelles", label: "🇸🇨 Seychelles", flag: "🇸🇨" },
    { value: "Sierra Leone", label: "🇸🇱 Sierra Leone", flag: "🇸🇱" },
    { value: "Singapore", label: "🇸🇬 Singapore", flag: "🇸🇬" },
    { value: "Slovakia", label: "🇸🇰 Slovakia", flag: "🇸🇰" },
    { value: "Slovenia", label: "🇸🇮 Slovenia", flag: "🇸🇮" },
    { value: "Solomon Islands", label: "🇸🇧 Solomon Islands", flag: "🇸🇧" },
    { value: "Somalia", label: "🇸🇴 Somalia", flag: "🇸🇴" },
    { value: "South Africa", label: "🇿🇦 South Africa", flag: "🇿🇦" },
    { value: "South Korea", label: "🇰🇷 South Korea", flag: "🇰🇷" },
    { value: "South Sudan", label: "🇸🇸 South Sudan", flag: "🇸🇸" },
    { value: "Spain", label: "🇪🇸 Spain", flag: "🇪🇸" },
    { value: "Sri Lanka", label: "🇱🇰 Sri Lanka", flag: "🇱🇰" },
    { value: "Sudan", label: "🇸🇩 Sudan", flag: "🇸🇩" },
    { value: "Suriname", label: "🇸🇷 Suriname", flag: "🇸🇷" },
    { value: "Sweden", label: "🇸🇪 Sweden", flag: "🇸🇪" },
    { value: "Switzerland", label: "🇨🇭 Switzerland", flag: "🇨🇭" },
    { value: "Syria", label: "🇸🇾 Syria", flag: "🇸🇾" },
    { value: "Taiwan", label: "🇹🇼 Taiwan", flag: "🇹🇼" },
    { value: "Tajikistan", label: "🇹🇯 Tajikistan", flag: "🇹🇯" },
    { value: "Tanzania", label: "🇹🇿 Tanzania", flag: "🇹🇿" },
    { value: "Thailand", label: "🇹🇭 Thailand", flag: "🇹🇭" },
    { value: "Timor-Leste", label: "🇹🇱 Timor-Leste", flag: "🇹🇱" },
    { value: "Togo", label: "🇹🇬 Togo", flag: "🇹🇬" },
    { value: "Tonga", label: "🇹🇴 Tonga", flag: "🇹🇴" },
    { value: "Trinidad and Tobago", label: "🇹🇹 Trinidad and Tobago", flag: "🇹🇹" },
    { value: "Tunisia", label: "🇹🇳 Tunisia", flag: "🇹🇳" },
    { value: "Turkey", label: "🇹🇷 Turkey", flag: "🇹🇷" },
    { value: "Turkmenistan", label: "🇹🇲 Turkmenistan", flag: "🇹🇲" },
    { value: "Tuvalu", label: "🇹🇻 Tuvalu", flag: "🇹🇻" },
    { value: "Uganda", label: "🇺🇬 Uganda", flag: "🇺🇬" },
    { value: "Ukraine", label: "🇺🇦 Ukraine", flag: "🇺🇦" },
    { value: "United Arab Emirates", label: "🇦🇪 United Arab Emirates", flag: "🇦🇪" },
    { value: "United Kingdom", label: "🇬🇧 United Kingdom", flag: "🇬🇧" },
    { value: "United States", label: "🇺🇸 United States", flag: "🇺🇸" },
    { value: "Uruguay", label: "🇺🇾 Uruguay", flag: "🇺🇾" },
    { value: "Uzbekistan", label: "🇺🇿 Uzbekistan", flag: "🇺🇿" },
    { value: "Vanuatu", label: "🇻🇺 Vanuatu", flag: "🇻🇺" },
    { value: "Vatican City", label: "🇻🇦 Vatican City", flag: "🇻🇦" },
    { value: "Venezuela", label: "🇻🇪 Venezuela", flag: "🇻🇪" },
    { value: "Vietnam", label: "🇻🇳 Vietnam", flag: "🇻🇳" },
    { value: "Yemen", label: "🇾🇪 Yemen", flag: "🇾🇪" },
    { value: "Zambia", label: "🇿🇲 Zambia", flag: "🇿🇲" },
    { value: "Zimbabwe", label: "🇿🇼 Zimbabwe", flag: "🇿🇼" }
];

  const selectedCountryData = countries.find(c => c.value === selectedCountry) || countries[0];

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) {
      return countries;
    }
    return countries.filter(country =>
      country.value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSelect = (country) => {
    onCountryChange(country.value);
    setIsOpen(false);
    setSearchTerm(""); // Clear search when selecting
  };

  const handleDropdownToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchTerm(""); // Clear search when closing
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF' }} className="p-4 rounded-lg shadow-sm border border-gray-200 h-full">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Country</h3>
      </div>
      
      <div className="relative">
        <button
          onClick={handleDropdownToggle}
          className="w-full text-white px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
          style={{ backgroundColor: '#508995' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#508995'}
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
          <div style={{ backgroundColor: '#FFFFFF' }} className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg shadow-lg z-10">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-black w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Countries List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(country)}
                    className={`w-full px-4 py-3 text-left flex items-center space-x-2 transition-colors hover:bg-gray-50 ${
                      selectedCountry === country.value ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{ 
                      backgroundColor: selectedCountry === country.value ? '#508995' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCountry !== country.value) {
                        e.target.style.backgroundColor = '#F9FAFB';
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
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No countries found matching "{searchTerm}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}