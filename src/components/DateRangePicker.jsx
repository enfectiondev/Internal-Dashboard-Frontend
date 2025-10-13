import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function DateRangePicker({ startDate, endDate, onDateRangeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  
  // ✅ Calculate date boundaries: today and 2 years back (in local timezone)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const twoYearsBack = new Date(today);
  twoYearsBack.setFullYear(today.getFullYear() - 2);
  twoYearsBack.setHours(0, 0, 0, 0);
  
  const currentYear = today.getFullYear();
  const [viewYear, setViewYear] = useState(currentYear);

  const formatDate = (date) => {
    return date ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "";
  };

  const formatDisplayRange = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    return "Select date range";
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const isMonthInRange = (year, month) => {
    if (!tempStartDate || !tempEndDate) return false;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    return (monthStart <= tempEndDate && monthEnd >= tempStartDate);
  };

  const isMonthStart = (year, month) => {
    if (!tempStartDate) return false;
    return tempStartDate.getFullYear() === year && tempStartDate.getMonth() === month;
  };

  const isMonthEnd = (year, month) => {
    if (!tempEndDate) return false;
    return tempEndDate.getFullYear() === year && tempEndDate.getMonth() === month;
  };

  const isMonthDisabled = (year, month) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Disable if month is completely outside the allowed range
    return monthEnd < twoYearsBack || monthStart > today;
  };

  const handleMonthClick = (year, month) => {
    if (isMonthDisabled(year, month)) return;
    
    // ✅ Create dates at start of day to avoid timezone issues
    const monthStart = new Date(year, month, 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(year, month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    // Clamp dates to allowed range
    const clampedStart = new Date(Math.max(monthStart.getTime(), twoYearsBack.getTime()));
    const clampedEnd = new Date(Math.min(monthEnd.getTime(), today.getTime()));
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(clampedStart);
      setTempEndDate(null);
    } else if (tempStartDate && !tempEndDate) {
      // Complete selection
      if (clampedStart < tempStartDate) {
        const endOfStartMonth = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth() + 1, 0);
        endOfStartMonth.setHours(23, 59, 59, 999);
        setTempEndDate(endOfStartMonth);
        setTempStartDate(clampedStart);
      } else {
        setTempEndDate(clampedEnd);
      }
    }
  };

  const handleApply = () => {
    if (tempStartDate && tempEndDate) {
      // ✅ Ensure dates are within allowed range and reset time
      const clampedStart = new Date(Math.max(tempStartDate.getTime(), twoYearsBack.getTime()));
      clampedStart.setHours(0, 0, 0, 0);
      
      const clampedEnd = new Date(Math.min(tempEndDate.getTime(), today.getTime()));
      clampedEnd.setHours(23, 59, 59, 999);
      
      console.log('[DateRangePicker] Applying dates:', {
        start: clampedStart,
        end: clampedEnd,
        startFormatted: clampedStart.toISOString().split('T')[0],
        endFormatted: clampedEnd.toISOString().split('T')[0]
      });
      
      onDateRangeChange(clampedStart, clampedEnd);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setIsOpen(false);
  };

  const canNavigateBack = () => {
    return viewYear > twoYearsBack.getFullYear();
  };

  const canNavigateForward = () => {
    return viewYear < currentYear;
  };

  const renderYearCalendar = (year) => {
    const startMonth = year === twoYearsBack.getFullYear() ? twoYearsBack.getMonth() : 0;
    const endMonth = year === currentYear ? today.getMonth() : 11;
    
    return (
      <div key={year} className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-3">{year}</div>
        <div className="grid grid-cols-6 gap-2">
          {monthNames.map((month, index) => {
            if (index < startMonth || index > endMonth) {
              return (
                <div key={month} className="px-3 py-2 text-sm text-gray-300">
                  {month}
                </div>
              );
            }
            
            const isInRange = isMonthInRange(year, index);
            const isStart = isMonthStart(year, index);
            const isEnd = isMonthEnd(year, index);
            const isCurrentMonth = currentYear === year && today.getMonth() === index;
            const disabled = isMonthDisabled(year, index);
            
            return (
              <button
                key={month}
                onClick={() => handleMonthClick(year, index)}
                disabled={disabled}
                className={`px-3 py-2 text-sm rounded-full transition-colors ${
                  disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isStart || isEnd
                    ? 'text-white font-medium'
                    : isInRange
                    ? 'bg-blue-100 text-blue-800'
                    : isCurrentMonth
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={{
                  backgroundColor: !disabled && (isStart || isEnd) ? '#508995' : 
                                 !disabled && isCurrentMonth && !isInRange ? '#3B82F6' : undefined
                }}
              >
                {month}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-3xl text-white transition-colors"
        style={{ backgroundColor: '#508995' }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#0E4854'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#508995'}
      >
        <Calendar size={16} />
        <span className="text-sm">{formatDisplayRange()}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50" 
             style={{ width: '500px', maxHeight: '500px' }}>
          
          {/* Single calendar area - no sidebar */}
          <div className="p-4">
            {/* Date Range Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-2">Available date range:</div>
              <div className="text-sm font-medium text-gray-800">
                {formatDate(twoYearsBack)} - {formatDate(today)}
              </div>
              {tempStartDate && tempEndDate && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-600">Selected:</div>
                  <div className="text-sm font-medium" style={{ color: '#508995' }}>
                    {formatDate(tempStartDate)} - {formatDate(tempEndDate)}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewYear(viewYear - 1)}
                disabled={!canNavigateBack()}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: '#1A4752' }}
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-medium text-gray-900">
                {viewYear} - {viewYear + 1}
              </span>
              <button
                onClick={() => setViewYear(viewYear + 1)}
                disabled={!canNavigateForward()}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: '#1A4752' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar years */}
            <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
              {renderYearCalendar(viewYear)}
              {viewYear + 1 <= currentYear && renderYearCalendar(viewYear + 1)}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-white-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                style={{ backgroundColor: '#508995' }}

              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!tempStartDate || !tempEndDate}
                className="px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                
                onMouseEnter={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#2c5e68ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.target.disabled) {
                    e.target.style.backgroundColor = '#2c5e68ff';
                  }
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}