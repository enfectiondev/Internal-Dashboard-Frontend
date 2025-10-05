import React, { useState, useRef, useEffect } from 'react';

const ScrollableTabs = ({ tabs, activeTab, onTabChange }) => {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const tabsContainerRef = useRef(null);

  const checkScrollPosition = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scroll = (direction) => {
    if (tabsContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = tabsContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
      
      setTimeout(checkScrollPosition, 300);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 bg-[#0F4653] hover:bg-[#508995] text-white p-2 rounded-full shadow-lg transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Tabs Container */}
      <div
        ref={tabsContainerRef}
        onScroll={checkScrollPosition}
        className="flex overflow-x-auto scrollbar-hide space-x-4 px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <div
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-shrink-0 min-w-[160px] px-6 py-4 text-sm text-center cursor-pointer transition-colors rounded-lg ${
                isActive
                  ? "bg-[#508995] text-black font-bold"
                  : "bg-[#0F4653] text-white font-bold hover:bg-white hover:text-black"
              }`}
            >
              {tab}
            </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 bg-[#0F4653] hover:bg-[#508995] text-white p-2 rounded-full shadow-lg transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ScrollableTabs;