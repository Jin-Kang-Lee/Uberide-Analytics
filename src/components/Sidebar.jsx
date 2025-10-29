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
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222531]"
        >
          <FaBookOpen className="text-orange-500 dark:text-yellow-400" />
          <span>Manage Bookings</span>
        </a>

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

        {/* MongoDB Database Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Mongolians
          </h3>
          <div className="space-y-1">
            
            <NavLink
              to="/mongo-trip-replay"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-green-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              <span>Trip Replay</span>
            </NavLink>

            <NavLink
              to="/mongo-recommendations"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Recommendations</span>
            </NavLink>

            <NavLink
              to="/mongo-promotions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-teal-600 text-white dark:bg-yellow-400 dark:text-black"
                    : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222531]"
                }`
              }
            >
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span>Promotions Lab</span>
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
