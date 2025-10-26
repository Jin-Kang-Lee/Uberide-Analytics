import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import TimeAnalysis from "./pages/TimeAnalysis";
import Locations from "./pages/Locations";
import Fleet from "./pages/Fleet";               // or keep your existing Vehicles.jsx page
import CustomerAnalysis from "./pages/CustomerAnalysis";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default path opens Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/city-insights" element={<CityInsights />} />
        <Route path="/time-analysis" element={<TimeAnalysis />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/fleet" element={<Fleet />} />        
        <Route path="/customers-analysis" element={<CustomerAnalysis />} />

      </Routes>
    </Router>
  );
}
