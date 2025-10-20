import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  
  // Check if current page is MongoDB-related
  const isMongoRoute = [
    '/operationaloverview',
    '/vehicles',
    '/locations',
    '/timeanalysis',
    '/customeranalysis'
  ].some(route => location.pathname.includes(route));

  // Check theme on load
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    setDarkMode(isDark);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    // MySQL Routes
    if (path === '/dashboard' || path === '/') return 'MySQL Dashboard';
    if (path.includes('/city-insights')) return 'City Insights';
    if (path.includes('/bookings')) return 'Manage Bookings';
    if (path === '/customers') return 'Customers';
    if (path.includes('/reports')) return 'Reports';
    
    // MongoDB Routes
    if (path.includes('/operationaloverview')) return 'Operational Overview';
    if (path.includes('/vehicles')) return 'Vehicle Analytics';
    if (path.includes('/locations')) return 'Location Analytics';
    if (path.includes('/timeanalysis')) return 'Time Analysis';
    if (path.includes('/customeranalysis')) return 'Customer Analysis';
    
    // Default
    return 'Uber Analytics Dashboard';
  };

  return (
    <nav
      className={`flex justify-between items-center px-6 py-4 shadow-md transition-all duration-300 rounded-none
      ${
        darkMode
          ? isMongoRoute
            ? "bg-[#0D1B2A] text-white" // Mongo dark mode - dark blue
            : "bg-[#2C2F38] text-white" // SQL dark mode - dark gray
          : isMongoRoute
            ? "bg-white text-black"     // Mongo light mode - WHITE like MySQL
            : "bg-white text-black"     // SQL light mode - white
      }`}
    >
      {/* ---- Dynamic Page Title ---- */}
      <h1 className="font-semibold text-lg tracking-wide">
        {getPageTitle()}
      </h1>

      {/* ---- Theme Toggle ---- */}
      <button
        onClick={toggleDarkMode}
        className={`relative w-10 h-10 flex items-center justify-center rounded-full
          ${
            darkMode
              ? isMongoRoute
                ? "bg-[#1B263B] hover:bg-[#2A3A5E] text-white"
                : "bg-[#3B3E47] hover:bg-[#4A4E58] text-white"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800"
          }
          transition-all duration-300 ease-in-out overflow-hidden`}
      >
        <FaSun
          className={`absolute text-xl transform transition-all duration-500 ease-in-out 
          ${darkMode ? "translate-y-10 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"}`}
        />
        <FaMoon
          className={`absolute text-lg transform transition-all duration-500 ease-in-out
          ${darkMode ? "translate-y-0 opacity-100 rotate-0" : "-translate-y-10 opacity-0 -rotate-90"}`}
        />
      </button>
    </nav>
  );
}
