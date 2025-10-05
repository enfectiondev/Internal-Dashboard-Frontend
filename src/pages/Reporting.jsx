import React from "react";

const Reporting = ({ period }) => {
  return (
    <div className="space-y-6">
      <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Reporting Dashboard
        </h2>
        <p className="text-[#A1BCD3]">
          Comprehensive analytics and reporting for period: {period}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white">Custom Reports</h3>
          <p className="text-[#A1BCD3] text-sm mt-2">
            Create and schedule custom reports
          </p>
          <div className="mt-4">
            <p className="text-white">Coming Soon</p>
          </div>
        </div>

        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white">Automated Reports</h3>
          <p className="text-[#A1BCD3] text-sm mt-2">
            Schedule automated report delivery
          </p>
          <div className="mt-4">
            <p className="text-white">Coming Soon</p>
          </div>
        </div>

        <div className="bg-[#1A6473] border border-[#508995] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white">Report Templates</h3>
          <p className="text-[#A1BCD3] text-sm mt-2">
            Pre-built report templates
          </p>
          <div className="mt-4">
            <p className="text-white">Coming Soon</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-500/20 border border-blue-500 text-blue-300 px-6 py-4 rounded-lg">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="font-semibold">Reporting Features Coming Soon</h4>
            <p className="text-sm mt-1">
              Advanced reporting and analytics features are currently in development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;