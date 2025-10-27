import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import CustomerInsights from "./pages/CustomerInsights";
import Vehicles from "./pages/Vehicles";
import { DataProvider } from "./context/DataContext";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default path opens Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/city-insights" element={<CityInsights />} />
        <Route path="/customer-insights" element={<CustomerInsights />} />
        <Route path="/mongo-vehicles" element={<Vehicles />} />
      </Routes>
    </Router>
  );
}
