import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import Vehicles from "./pages/Vehicles";

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default path opens Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/city-insights" element={<CityInsights />} />
        <Route path="/mongo-vehicles" element={<Vehicles />} />
      </Routes>
    </Router>
  );
}
