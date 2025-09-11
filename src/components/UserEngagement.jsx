import React, { useState, useEffect } from "react";

const UserEngagement = () => {
  const [allFunnelData, setAllFunnelData] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("selection");
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          "https://eyqi6vd53z.us-east-2.awsapprunner.com/api/analytics/conversions/453831024?period=30d",
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = await res.json();

        const transformed = data.map((item) => ({
          label: item.eventName,
          value: item.eventCount,
          percent: item.eventCountRate?.toFixed(2) + "%",
          drop: null,
        }));

        setAllFunnelData(transformed);
      } catch (err) {
        console.error("Failed to fetch funnel data:", err);
        setAllFunnelData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, []);

  const toggleLabelSelection = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const generateFunnel = () => {
    if (selectedLabels.length > 0) setCurrentScreen("funnel");
  };

  const resetSelection = () => {
    setCurrentScreen("selection");
    setSelectedLabels([]);
  };

  const getSelectedFunnelData = () =>
    allFunnelData.filter((item) => selectedLabels.includes(item.label));

  if (loading)
    return <p className="text-center py-10">Loading funnel data...</p>;

  // ---------------- SELECTION SCREEN ----------------
  if (currentScreen === "selection") {
    return (
      <div className="w-full max-w-5xl px-4 py-6 mx-auto bg-white rounded-lg shadow-lg relative">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-black">User Engagement Funnel</h3>
          <div className="relative">
           <button
            onClick={() => setShowMessage(!showMessage)}
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
          >
            {/* AI image */}
            <img src="/images/ai.png" alt="AI Assistant" className="w-6 h-6" />

            {/* Glowing ping */}
            <span className="absolute inset-0 rounded-full animate-ping bg-[#508995] opacity-50"></span>
          </button>
          </div>
        </div>

        {showMessage && (
          <div className="absolute top-20 right-4 bg-[#508995] text-white p-4 rounded-lg text-center animate-pulse z-50">
            🤖 Hi! I'm your AI Assistant. How can I help?
          </div>
        )}

        <hr className="border-t-1 border-black mb-6" />

        {/* Label Selection */}
        <div className="mb-8">
          <h4 className="text-normal font-semibold mb-4 text-gray-700">
            Select labels to include in your funnel:
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {allFunnelData.map((item) => (
              <div
                key={item.label}
                onClick={() => toggleLabelSelection(item.label)}
                className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-gray-50 rounded"
              >
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedLabels.includes(item.label)
                      ? "bg-blue-500 border-blue-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  {selectedLabels.includes(item.label) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 font-bold text-sm text-black">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateFunnel}
            disabled={selectedLabels.length === 0}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              selectedLabels.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#508995] to-[#6BA4B8] text-white hover:shadow-lg hover:scale-105 active:scale-95"
            }`}
          >
            Generate Funnel
          </button>
        </div>
      </div>
    );
  }

  // ---------------- FUNNEL SCREEN ----------------
  const funnelData = getSelectedFunnelData();

  return (
    <div className="w-full max-w-5xl p-4 mx-auto bg-white rounded-lg relative">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-black">User Engagement Funnel</h3>
          <button
            onClick={resetSelection}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            ← Back to Selection
          </button>
        </div>

        {/* AI Icon */}
        <div className="relative">
          <button
            onClick={() => setShowMessage(!showMessage)}
            className="relative w-12 h-12 rounded-full flex items-center justify-center"
          >
            {/* AI image */}
            <img src="/images/ai.png" alt="AI Assistant" className="w-6 h-6" />

            {/* Glowing ping */}
            <span className="absolute inset-0 rounded-full animate-ping bg-[#508995] opacity-50"></span>
          </button>
        </div>
      </div>

      {showMessage && (
        <div className="absolute top-20 right-4 bg-[#508995] text-white p-4 rounded-lg text-center animate-pulse z-50">
          🤖 Hi! I'm your AI Assistant. How can I help?
        </div>
      )}

      <hr className="border-t-1 border-black mb-4" />

      {/* Selected Items as Checkboxes */}
      <div className="mb-4 flex flex-wrap gap-2">
        {funnelData.map((item) => (
          <div
            key={item.label}
            className="flex items-center space-x-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
          >
            <div
              className={`w-4 h-4 border-2 flex items-center justify-center rounded ${
                selectedLabels.includes(item.label)
                  ? "bg-blue-500 border-blue-500"
                  : "bg-white border-gray-300"
              }`}
            >
              {selectedLabels.includes(item.label) && (
                <svg
                  className="w-2 h-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Funnel Chart */}
      <div className="space-y-1">
        {funnelData.map((item, index) => {
          const width = 100 - index * 8;
          const nextWidth =
            index < funnelData.length - 1 ? 100 - (index + 1) * 8 : width - 10;

          return (
            <div key={item.label} className="flex items-center">
              <div className="w-40 text-right pr-4 font-bold text-black">
                {item.label}
              </div>

              <div className="flex-1 flex justify-center items-center">
                <div
                  className="bg-[#508995] text-white text-sm font-medium flex items-center justify-center"
                  style={{
                    width: `${width * 3.5}px`,
                    height: "42px",
                    clipPath: `polygon(${(100 - width) / 2}% 0%, ${
                      100 - (100 - width) / 2
                    }% 0%, ${100 - (100 - nextWidth) / 2}% 100%, ${
                      (100 - nextWidth) / 2
                    }% 100%)`,
                  }}
                >
                  {item.value.toLocaleString()}
                </div>
              </div>

              <div className="w-12 text-left pl-2 font-bold text-black">
                {item.percent}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserEngagement;
