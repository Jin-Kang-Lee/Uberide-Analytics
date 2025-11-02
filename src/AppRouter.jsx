import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CityInsights from "./pages/CityInsights";
import TripReplay from "./pages/TripReplay";
import RideRecommendations from "./pages/RideRecommendations";
import PromotionsLab from "./pages/PromotionsLab";


export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Default path opens Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/city-insights" element={<CityInsights />} />
        <Route path="/mongo-trip-replay" element={<TripReplay />} />
        <Route path="/mongo-recommendations" element={<RideRecommendations />} />
        <Route path="/mongo-promotions" element={<PromotionsLab />} />

      </Routes>
    </Router>
  );
}
