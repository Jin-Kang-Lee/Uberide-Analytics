import React from "react";
import { NavLink } from "react-router-dom";
import { 
  FaChartBar, 
  FaGlobeAsia, 
  FaBookOpen, 
  FaUsers, 
  FaChartLine,
  FaDatabase,
  FaLeaf,
  FaCar,
  FaMapMarkerAlt,
  FaClock,
  FaUserFriends
} from "react-icons/fa";
import { SiMongodb } from "react-icons/si";

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


        {/* MongoDB Database Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Operational Overview
          </h3>
          <div className="space-y-1">
            {/* Operational Overview */}
            <NavLink
              to="/operationaloverview"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-green-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <SiMongodb 
                    className={isActive ? "text-white dark:text-black" : "text-green-600 dark:text-yellow-400"} 
                  />
                  <span>Operational Overview</span>
                </>
              )}
            </NavLink>

            {/* Vehicles - Purple */}
            <NavLink
              to="/mongo-vehicles"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FaCar 
                    className={isActive ? "text-white dark:text-black" : "text-purple-600 dark:text-yellow-400"} 
                    size={18}
                  />
                  <span>Vehicles</span>
                </>
              )}
            </NavLink>

            {/* Locations - Red */}
            <NavLink
              to="/mongo-locations"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-red-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FaMapMarkerAlt 
                    className={isActive ? "text-white dark:text-black" : "text-red-600 dark:text-yellow-400"} 
                    size={18}
                  />
                  <span>Locations</span>
                </>
              )}
            </NavLink>

            {/* Time Analysis - Blue */}
            <NavLink
              to="/mongo-time-analysis"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FaClock 
                    className={isActive ? "text-white dark:text-black" : "text-blue-600 dark:text-yellow-400"} 
                    size={18}
                  />
                  <span>Time Analysis</span>
                </>
              )}
            </NavLink>

            {/* Customer Analysis - Teal */}
            <NavLink
              to="/mongo-customer-analysis"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FaUserFriends 
                    className={isActive ? "text-white dark:text-black" : "text-teal-600 dark:text-yellow-400"} 
                    size={18}
                  />
                  <span>Customer Analysis</span>
                </>
              )}
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Footer - Database Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FaDatabase className="text-blue-600 dark:text-yellow-400" size={12} />
              <span className="text-gray-500 dark:text-gray-400">MySQL</span>
            </div>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FaLeaf className="text-green-600 dark:text-yellow-400" size={12} />
              <span className="text-gray-500 dark:text-gray-400">MongoDB</span>
            </div>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
