import React from "react";
import { NavLink } from "react-router-dom";
import { FaChartBar, FaGlobeAsia, FaUsers } from "react-icons/fa";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl h-screen flex flex-col">
      {/* Logo / Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-yellow-400">
          Uber Analytics
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-3 text-gray-800 dark:text-gray-200">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaChartBar className="text-blue-600 dark:text-yellow-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* City Insights */}
        <NavLink
          to="/city-insights"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaGlobeAsia className="text-green-600 dark:text-yellow-400" />
          <span>City Insights</span>
        </NavLink>

        {/* Customer Insights */}
        <NavLink
          to="/customer-insights"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaUsers className="text-purple-600 dark:text-yellow-400" />
          <span>Customer Insights</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        © 2025 Uber Analytics
      </div>
    </aside>
  );
}
