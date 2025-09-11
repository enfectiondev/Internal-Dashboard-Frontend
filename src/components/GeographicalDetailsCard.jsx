import React, { useState } from 'react';

export default function GeographicalDetailsCard() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Sample geographical data with regions and cities
  const countryData = [
    { 
      name: "Sri Lanka", 
      users: 5423, 
      percentage: 35.2,
      regions: [
        { name: "Western Province", users: 2450, cities: ["Colombo", "Gampaha", "Kalutara"] },
        { name: "Southern Province", users: 1200, cities: ["Galle", "Matara", "Hambantota"] },
        { name: "Central Province", users: 950, cities: ["Kandy", "Nuwara Eliya", "Matale"] },
        { name: "North Western Province", users: 823, cities: ["Kurunegala", "Puttalam"] }
      ]
    },
    { 
      name: "India", 
      users: 7210, 
      percentage: 46.8,
      regions: [
        { name: "Maharashtra", users: 2100, cities: ["Mumbai", "Pune", "Nagpur"] },
        { name: "Karnataka", users: 1800, cities: ["Bangalore", "Mysore", "Hubli"] },
        { name: "Tamil Nadu", users: 1650, cities: ["Chennai", "Coimbatore", "Madurai"] },
        { name: "Delhi", users: 1660, cities: ["New Delhi", "Gurgaon", "Noida"] }
      ]
    },
    { 
      name: "USA", 
      users: 1890, 
      percentage: 12.3,
      regions: [
        { name: "California", users: 650, cities: ["Los Angeles", "San Francisco", "San Diego"] },
        { name: "New York", users: 480, cities: ["New York City", "Buffalo", "Rochester"] },
        { name: "Texas", users: 420, cities: ["Houston", "Dallas", "Austin"] },
        { name: "Florida", users: 340, cities: ["Miami", "Orlando", "Tampa"] }
      ]
    },
    { 
      name: "UK", 
      users: 890, 
      percentage: 5.7,
      regions: [
        { name: "England", users: 650, cities: ["London", "Manchester", "Birmingham"] },
        { name: "Scotland", users: 140, cities: ["Edinburgh", "Glasgow", "Aberdeen"] },
        { name: "Wales", users: 70, cities: ["Cardiff", "Swansea", "Newport"] },
        { name: "Northern Ireland", users: 30, cities: ["Belfast", "Derry", "Lisburn"] }
      ]
    }
  ];

  const totalUsers = countryData.reduce((sum, country) => sum + country.users, 0);

  return (
    <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
      <h3 className="font-semibold mb-4 text-gray-900">Geographical Details</h3>
      <hr className="mb-4" />

      {/* World Map Visualization */}
      <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 mb-4 h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-green-200/20 rounded-lg"></div>
        <div className="relative z-10 grid grid-cols-2 gap-4 h-full">
          {countryData.map((country, index) => {
            const size = Math.max(20, (country.users / totalUsers) * 80);
            const positions = [
              { top: '20%', left: '15%' }, // Sri Lanka
              { top: '30%', left: '25%' }, // India  
              { top: '25%', left: '70%' }, // USA
              { top: '15%', left: '45%' }  // UK
            ];
            
            return (
              <div
                key={country.name}
                className={`absolute rounded-full cursor-pointer transition-all duration-300 flex items-center justify-center text-white font-semibold text-xs shadow-lg hover:shadow-xl ${
                  selectedCountry === country.name 
                    ? 'bg-red-500 z-20 scale-110' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  top: positions[index]?.top || '50%',
                  left: positions[index]?.left || '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={() => setSelectedCountry(
                  selectedCountry === country.name ? null : country.name
                )}
                title={`${country.name}: ${country.users.toLocaleString()} users`}
              >
                {country.users > 1000 ? `${Math.round(country.users/1000)}K` : country.users}
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
          Click circles to view details
        </div>
      </div>

      {/* Country List */}
      <div className="grid grid-cols-1 gap-2">
        {countryData.map((country) => (
          <div
            key={country.name}
            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedCountry === country.name
                ? 'bg-blue-100 border-l-4 border-blue-500'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => setSelectedCountry(
              selectedCountry === country.name ? null : country.name
            )}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    selectedCountry === country.name ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                ></div>
                <span className="font-medium">{country.name}</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{country.users.toLocaleString()}</div>
                <div className="text-sm text-gray-500">{country.percentage}%</div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedCountry === country.name && (
              <div className="mt-3 pl-6 border-l-2 border-gray-200">
                <h4 className="font-medium text-sm mb-2 text-gray-700">Regional Breakdown:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {country.regions.map((region, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="font-medium">{region.name}</span>
                        <div className="text-xs text-gray-500">
                          {region.cities.slice(0, 2).join(", ")}
                          {region.cities.length > 2 && ` +${region.cities.length - 2} more`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{region.users.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">
                          {((region.users / country.users) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-600">
          Total Users: <span className="font-semibold text-gray-800">{totalUsers.toLocaleString()}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {selectedCountry ? `Viewing details for ${selectedCountry}` : 'Click on countries to view regional breakdown'}
        </div>
      </div>
    </div>
  );
}