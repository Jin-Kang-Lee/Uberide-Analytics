import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import CustomerInsights from "./pages/CustomerInsights";
import Vehicles from "./pages/Vehicles";
import { DataProvider } from "./context/DataContext";
import Bookings from "./pages/Bookings";

export default function AppRouter() {
  return (
    <DataProvider>
      <Router>
        <Routes>
          {/* Default path opens Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/city-insights" element={<CityInsights />} />
          <Route path="/manage-bookings" element={<Bookings />} />
        </Routes>
      </Router>
    </DataProvider>
    
  );
}
