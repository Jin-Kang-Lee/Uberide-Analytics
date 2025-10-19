import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const isMongo = location.pathname.includes("mongo");

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

  return (
    <nav
      className={`flex justify-between items-center px-6 py-4 shadow-md transition-all duration-300 rounded-none
      ${
        darkMode
          ? isMongo
            ? "bg-[#0D1B2A] text-white" // Mongo dark mode
            : "bg-[#2C2F38] text-white" // ✅ SQL dark mode = white text now
          : isMongo
            ? "bg-[#243763] text-white" // Mongo light mode
            : "bg-white text-black"     // SQL light mode
      }`}
    >
      {/* ---- Title ---- */}
      <h1 className="font-semibold text-lg tracking-wide">
        {isMongo ? "MongoDB Analytics Dashboard" : "Uber Analytics Dashboard"}
      </h1>

      {/* ---- Links ---- */}
      <div className="flex items-center space-x-6 font-medium">
        <Link
          to="/sql"
          className={`transition ${
            darkMode
              ? "text-white hover:text-gray-300" // ✅ white text in dark mode
              : "text-black hover:text-gray-700"
          }`}
        >
          SQL Dashboard
        </Link>
        <Link
          to="/mongo"
          className={`transition ${
            darkMode
              ? "text-white hover:text-gray-300"
              : "text-black hover:text-gray-700"
          }`}
        >
          MongoDB Dashboard
        </Link>
      </div>

      {/* ---- Theme Toggle ---- */}
      <button
        onClick={toggleDarkMode}
        className={`relative w-10 h-10 flex items-center justify-center rounded-full
          ${
            darkMode
              ? isMongo
                ? "bg-[#1B263B] hover:bg-[#2A3A5E] text-white"
                : "bg-[#3B3E47] hover:bg-[#4A4E58] text-white"
              : isMongo
                ? "bg-[#3B4A80] hover:bg-[#4C5DA0] text-white"
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
