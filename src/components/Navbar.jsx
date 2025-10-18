import React, { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa"; // ✅ icon set

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);

  // Check current theme on load
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  // Toggle theme
  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    setDarkMode(isDark);
  };

  return (
    <nav className="flex justify-between items-center bg-white dark:bg-[#181A20] text-gray-800 dark:text-gray-200 p-4 shadow rounded-xl">
      <h1 className="font-semibold text-lg">Uber Analytics</h1>

      {/* Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="relative w-10 h-10 flex items-center justify-center rounded-full
                   bg-gray-200 hover:bg-gray-300
                   dark:bg-yellow-500 dark:hover:bg-yellow-400
                   text-gray-800 dark:text-black
                   transition-all duration-300 ease-in-out overflow-hidden"
      >
        {/* ☀️ Sun icon */}
        <FaSun
          className={`absolute text-xl transform transition-all duration-500 ease-in-out 
                     ${darkMode ? "translate-y-10 opacity-0 rotate-90" : "translate-y-0 opacity-100 rotate-0"}`}
        />

        {/* 🌙 Moon icon */}
        <FaMoon
          className={`absolute text-lg transform transition-all duration-500 ease-in-out
                     ${darkMode ? "translate-y-0 opacity-100 rotate-0" : "-translate-y-10 opacity-0 -rotate-90"}`}
        />
      </button>
    </nav>
  );
}
