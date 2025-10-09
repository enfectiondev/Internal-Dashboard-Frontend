import React from "react";

function FacebookMetricCards({ insights, isLoading, page }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-gray-300 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const metrics = [
    {
      title: "Page Followers",
      value: insights.followers?.toLocaleString() || 0,
      subtitle: "Total followers",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "blue"
    },
    {
      title: "Page Fans",
      value: insights.fans?.toLocaleString() || 0,
      subtitle: "Total page likes",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      color: "red"
    },
    {
      title: "Impressions",
      value: insights.impressions?.toLocaleString() || 0,
      subtitle: "Total post views",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: "purple"
    },
    {
      title: "Unique Impressions",
      value: insights.unique_impressions?.toLocaleString() || 0,
      subtitle: "Unique viewers",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "indigo"
    },
    {
      title: "Post Engagements",
      value: insights.post_engagements?.toLocaleString() || 0,
      subtitle: "Total interactions",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      color: "green"
    },
    {
      title: "Engaged Users",
      value: insights.engaged_users?.toLocaleString() || 0,
      subtitle: "Users who engaged",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: "yellow"
    },
    {
      title: "Page Views",
      value: insights.page_views?.toLocaleString() || 0,
      subtitle: "Profile visits",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "pink"
    },
    {
      title: "New Likes",
      value: insights.new_likes?.toLocaleString() || 0,
      subtitle: "In selected period",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      color: "teal"
    }
  ];

const colorClasses = {
    blue: "border-black text-[#0f4653]",
    red: "border-black text-[#0f4653]",
    purple: "border-black text-[#0f4653]",
    indigo: "border-black text-[#0f4653]",
    green: "border-black text-[#0f4653]",
    yellow: "border-black text-[#0f4653]",
    pink: "border-black text-[#0f4653]",
    teal: "border-black text-[#0f4653]"
};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${colorClasses[metric.color] || 'border-gray-300'}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="text-[15px] font-bold text-[#1A4752] uppercase tracking-wide">
              {metric.title}
            </div>
            <div className={colorClasses[metric.color]}>
              {metric.icon}
            </div>
          </div>
          <div className="text-3xl font-bold text-black">
            {metric.value}
          </div>
          <div className="text-[13px] font-bold text-gray-500 mt-1">
            {metric.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}

export default FacebookMetricCards;