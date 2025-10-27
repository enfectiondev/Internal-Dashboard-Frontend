import React, { useState, useRef } from "react";
import { useApiWithCache } from "../hooks/useApiWithCache";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function GeographicalDetailsCard({ activeProperty, period, customDates }) {
  const [selectedCity, setSelectedCity] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Fetch city data
  const { data: cityData, loading, error } = useApiWithCache(
    activeProperty?.id,
    period,
    "audience-insights-city",
    async (propertyId, analyticsPeriod, customDatesParam) => {
      const token = localStorage.getItem("token");
      
      let url = `${process.env.REACT_APP_API_BASE_URL}/api/analytics/audience-insights/${propertyId}?dimension=city&period=${analyticsPeriod}`;
      
      if (analyticsPeriod === 'custom' && customDatesParam?.startDate && customDatesParam?.endDate) {
        url += `&start_date=${customDatesParam.startDate}&end_date=${customDatesParam.endDate}`;
      }
      
      const res = await fetch(url, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          : { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      return await res.json();
    },
    {
      isAnalytics: true,
      convertPeriod: false,  // Changed to false since period is already converted in Layout
      customDates  // Add this line
    }
  );

  // Calculate valid cities first - before any useEffect that uses it
  const validCities = cityData
    ? cityData.filter(
        (city) =>
          city.value !== "(not set)" &&
          city.latitude !== 0 &&
          city.longitude !== 0 &&
          city.latitude !== null &&
          city.longitude !== null
      )
    : [];

  const totalUsers = cityData
    ? cityData.reduce((sum, city) => sum + city.users, 0)
    : 0;
  const maxUsers =
    validCities.length > 0
      ? Math.max(...validCities.map((c) => c.users))
      : 0;

  const colors = ["#508995", "#58C3DB", "#2B889C", "#1A4752"];

  // Calculate how many cards to show at once
  const cardsPerView = 3;
  const totalSlides = Math.max(0, validCities.length - cardsPerView + 1);

  // Auto-scroll functionality - now validCities is defined
  React.useEffect(() => {
    if (!isAutoScrolling || !validCities.length) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validCities.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoScrolling, validCities.length]);

  // Navigation functions
  const goToNext = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => (prev + 1) % validCities.length);
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const goToPrev = () => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => (prev - 1 + validCities.length) % validCities.length);
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  const goToSlide = (index) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);
    // Resume auto-scroll after 10 seconds of inactivity
    setTimeout(() => setIsAutoScrolling(true), 10000);
  };

  if (!activeProperty) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-96 text-gray-500 font-medium">
          Please select a property to view geographical details.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-96 text-gray-500 font-medium">
          Loading geographical data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white text-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-96 text-red-500 font-medium">
          Failed to load geographical data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900 text-xl">
          Global User Distribution
        </h3>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total Users: </span>
          <span
            className="font-bold"
            style={{ color: "#1A4752" }}
          >
            {totalUsers.toLocaleString()}
          </span>
          <span className="ml-4 font-medium">Cities: </span>
          <span
            className="font-bold"
            style={{ color: "#508995" }}
          >
            {validCities.length}
          </span>
        </div>
      </div>

      {/* Real Map with react-leaflet */}
      <div className="relative rounded-lg overflow-hidden shadow-md mb-4">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />
          {validCities.map((city, index) => {
            const size = Math.max(
              6,
              Math.min(25, (city.users / maxUsers) * 20 + 6)
            );
            const color = colors[index % colors.length];
            return (
              <CircleMarker
                key={city.value}
                center={[city.latitude, city.longitude]}
                radius={size}
                fillColor={color}
                fillOpacity={0.7}
                stroke
                color="white"
                weight={1}
                eventHandlers={{
                  click: () => setSelectedCity(city.value)
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="text-sm font-semibold">
                    {city.value}
                  </div>
                  <div>Users: {city.users.toLocaleString()}</div>
                  <div>
                    Share: {city.percentage.toFixed(1)}%
                  </div>
                  <div>
                    Engagement: {city.engagementRate.toFixed(1)}%
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Carousel Section */}
      {validCities.length > 0 && (
        <div
          className="relative h-32 rounded-lg border overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #1A4752 0%, #2B889C 50%, #508995 100%)"
          }}
        >
          {/* Left Arrow */}
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: "#1A4752", color: "white" }}
            disabled={validCities.length <= cardsPerView}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: "#1A4752", color: "white" }}
            disabled={validCities.length <= cardsPerView}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>

          {/* Cards Container */}
          <div className="absolute inset-0 flex items-center px-12">
            <div 
              className="flex space-x-4 transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (180 + 16)}px)` // 180px card width + 16px gap
              }}
            >
              {validCities.map((city, index) => (
                <div
                  key={city.value}
                  className="flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 p-3 w-[180px] cursor-pointer transition-all duration-200 hover:shadow-lg hover:bg-gray-50 transform hover:scale-105"
                  onClick={() => setSelectedCity(city.value)}
                >
                  <div
                    className="text-xs font-bold text-gray-800 truncate mb-2"
                    title={city.value}
                    style={{ color: "#1A4752" }}
                  >
                    {city.value.length > 22
                      ? city.value.substring(0, 22) + "..."
                      : city.value}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div
                      className="text-center text-white rounded-md p-2"
                      style={{ backgroundColor: "#1A4752" }}
                    >
                      <div className="font-bold text-sm">
                        {city.users > 999
                          ? `${(city.users / 1000).toFixed(1)}K`
                          : city.users}
                      </div>
                      <div style={{ fontSize: "9px" }}>Users</div>
                    </div>
                    <div
                      className="text-center text-white rounded-md p-2"
                      style={{ backgroundColor: "#508995" }}
                    >
                      <div className="font-bold text-sm">
                        {city.percentage.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: "9px" }}>Share</div>
                    </div>
                    <div
                      className="text-center text-white rounded-md p-2"
                      style={{ backgroundColor: "#58C3DB" }}
                    >
                      <div className="font-bold text-sm">
                        {city.engagementRate.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: "9px" }}>Engage</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {totalSlides > 1 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToSlide(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected City Details */}
      {selectedCity && (
        <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: "#f8fafc", borderColor: "#508995" }}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold" style={{ color: "#1A4752" }}>
              Selected: {selectedCity}
            </h4>
            <button
              onClick={() => setSelectedCity(null)}
              className="text-gray-500 hover:text-gray-700 font-bold text-lg"
            >
              ✕
            </button>
          </div>
          {validCities.filter(city => city.value === selectedCity).map(city => (
            <div key={city.value} className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xl font-bold" style={{ color: "#1A4752" }}>
                  {city.users.toLocaleString()}
                </div>
                <div className="text-gray-500 text-xs">Total Users</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xl font-bold" style={{ color: "#508995" }}>
                  {city.percentage.toFixed(1)}%
                </div>
                <div className="text-gray-500 text-xs">Market Share</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xl font-bold" style={{ color: "#58C3DB" }}>
                  {city.engagementRate.toFixed(1)}%
                </div>
                <div className="text-gray-500 text-xs">Engagement Rate</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}