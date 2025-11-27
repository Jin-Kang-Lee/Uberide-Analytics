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
  FaUserFriends,
  FaHotdog
} from "react-icons/fa";
import { SiMongodb } from "react-icons/si";
import { BsStars } from "react-icons/bs";

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
          <FaHotdog className="text-yellow-400 dark:text-yellow-400" />
          <span>Manage Bookings</span>
        </NavLink>


        {/* MongoDB Database Section */}
        <div>
          <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            MongoDB
          </h3>

          <div className="space-y-1">
            {/* Trip Replay */}
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
              <FaChartLine className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span>Trip Replay</span>
            </NavLink>

            {/* Recommendations */}
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
              <BsStars className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Recommendations</span>
            </NavLink>

            {/* Promotions Lab */}
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
              <FaPercent className="w-5 h-5 text-teal-600 dark:text-teal-400" />
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
