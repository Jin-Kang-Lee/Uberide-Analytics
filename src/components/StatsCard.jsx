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
    <div className="bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl flex items-center space-x-4 transition-colors duration-300 hover:shadow-md">
      {/* Icon */}
      <div className="text-3xl flex-shrink-0">{icon}</div>

      {/* Text content */}
      <div className="flex flex-col">
        <p className="text-gray-500 text-sm">{title}</p>

        {loading ? (
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(value)}
          </h3>
        )}
      </div>
    </div>
  );
}
