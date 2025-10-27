import React from "react";
import { NavLink } from "react-router-dom";
import { FaChartBar, FaGlobeAsia, FaBookOpen, FaUsers, FaChartLine } from "react-icons/fa";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-[#181A20] shadow-sm p-4 rounded-2xl">
      {/* Logo / Header */}
      <div className="p-6 border-b">
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
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaChartBar className="text-blue-600 dark:text-yellow-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* City & Region Insights */}
        <NavLink
          to="/city-insights"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaGlobeAsia className="text-green-600 dark:text-yellow-400" />
          <span>City Insights</span>
        </NavLink>

         {/* Manage Bookings */}
        <NavLink
          to="/manage-bookings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                : "hover:bg-gray-100 dark:hover:bg-[#222531]"
            }`
          }
        >
          <FaGlobeAsia className="text-green-600 dark:text-yellow-400" />
          <span>Manage Bookings</span>
        </NavLink>

        {/* Customers */}
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]"
        >
          <FaUsers className="text-teal-600 dark:text-yellow-400" />
          <span>Customers</span>
        </a>

        {/* Reports */}
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]"
        >
          <FaChartLine className="text-purple-600 dark:text-yellow-400" />
          <span>Reports</span>
        </a>
      </nav>
    </aside>
  );
}
