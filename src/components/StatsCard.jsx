import React from "react";

export default function StatsCard({ title, value, icon, loading }) {
  // Format large numbers (e.g., 12000 -> 12k)
  const formatNumber = (num) => {
    if (num === null || num === undefined) return "-";
    if (typeof num !== "number") return num; // handle strings like "$1200"
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toLocaleString();
  };

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-[#181A20] shadow-sm hover:shadow-md transition-all rounded-2xl p-5">
      {/* Icon */}
      <div className="text-4xl text-gray-700 dark:text-yellow-400 flex-shrink-0">
        {icon}
      </div>

      {/* Text Content */}
      <div className="flex flex-col justify-center">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>

        {/* Loading shimmer */}
        {loading ? (
          <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatNumber(value)}
          </h3>
        )}
      </div>
    </div>
  );
}
