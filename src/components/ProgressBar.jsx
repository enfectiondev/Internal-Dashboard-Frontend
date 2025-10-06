// ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ loaded, total, isComplete }) => {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
  
  if (isComplete) {
    return (
      <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 flex items-center space-x-3">
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-green-700 font-medium text-sm">
          All {total} campaigns loaded successfully!
        </span>
      </div>
    );
  }
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-900">
          Loading campaigns... {loaded} of {total}
        </span>
        <span className="text-sm font-semibold text-blue-900">{percentage}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-blue-700 mt-2">
        Data is being loaded in batches. The table will update automatically.
      </p>
    </div>
  );
};

export default ProgressBar;