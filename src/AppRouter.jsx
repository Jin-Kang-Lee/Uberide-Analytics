import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import CustomerInsights from "./pages/CustomerInsights";

export default function AppRouter() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0B0E11] text-gray-800 dark:text-gray-200">
        {/* Sidebar stays always visible */}
        <Sidebar />

        {/* Right side content (Navbar + Page Content) */}
        <div className="flex-1 flex flex-col">
          <Navbar />

          <main className="p-6 space-y-8 overflow-y-auto">
            <Routes>
              {/* Default path */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* Pages */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/city-insights" element={<CityInsights />} />
              <Route path="/customer-insights" element={<CustomerInsights />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
